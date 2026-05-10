import { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import { invalidateRelatedCache } from '../middleware/cache.middleware';
import Blog from '../schema/blog.schema';
import { sendNewsletterNotification } from './newsletter.controller';

/**
 * Get all blogs
 */
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const { category, tag, featured, published, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // For public API, only return published blogs
    // For admin API, return all blogs if published is not specified
    if (req.path.startsWith('/api/blogs/admin')) {
      if (published) {
        query.published = published === 'true';
      }
    } else {
      query.published = true;
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count
    const total = await Blog.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: blogs.length,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: {
        blogs,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to get blogs: ${(error as Error).message}`, 500);
  }
};

/**
 * Get a single blog by ID or slug
 */
export const getBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let blog;
    if (isValidObjectId) {
      blog = await Blog.findById(id);
    } else {
      // If not a valid ObjectId, try to find by slug
      blog = await Blog.findOne({ slug: id });
    }
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }
    
    // For public API, only return published blogs
    if (!req.path.startsWith('/api/blogs/admin') && !blog.published) {
      throw new AppError('Blog not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to get blog: ${(error as Error).message}`, 500);
  }
};

/**
 * Create a new blog
 */
export const createBlog = async (req: Request, res: Response) => {
  try {
    const {
      title,
      subtitle,
      coverImage,
      cloudinaryId,
      category,
      tags,
      author,
      readTime,
      intro,
      content,
      sections,
      published,
      featured,
    } = req.body;
    
    // Create new blog
    const newBlog = await Blog.create({
      title,
      subtitle,
      coverImage,
      cloudinaryId,
      category,
      tags: tags ? JSON.parse(tags) : [],
      author,
      readTime,
      intro,
      content,
      sections: sections ? JSON.parse(sections) : [],
      published: published === 'true',
      featured: featured === 'true',
    });
    
    // If the blog is published, send newsletter notification
    if (newBlog.published) {
      try {
        sendNewsletterNotification('blog', newBlog);
      } catch (error) {
        console.error('Failed to send newsletter notification:', error);
        // Don't throw error, just log it
      }
    }
    
    // Invalidate related cache
    await invalidateRelatedCache('blog', newBlog.id);
    
    res.status(201).json({
      status: 'success',
      data: {
        blog: newBlog,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to create blog: ${(error as Error).message}`, 500);
  }
};

/**
 * Update a blog
 */
export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      coverImage,
      cloudinaryId,
      category,
      tags,
      author,
      readTime,
      intro,
      content,
      sections,
      published,
      featured,
    } = req.body;
    
    // Find blog
    const blog = await Blog.findById(id);
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }
    
    // Check if blog was previously unpublished and is now being published
    const wasPublished = blog.published;
    const isNowPublished = published === 'true';
    const shouldSendNewsletter = !wasPublished && isNowPublished;
    
    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        subtitle,
        coverImage,
        cloudinaryId,
        category,
        tags: tags ? JSON.parse(tags) : blog.tags,
        author,
        readTime,
        intro,
        content,
        sections: sections ? JSON.parse(sections) : blog.sections,
        published: published === 'true',
        featured: featured === 'true',
      },
      { new: true, runValidators: true }
    );
    
    // If the blog is being published for the first time, send newsletter notification
    if (shouldSendNewsletter) {
      try {
        sendNewsletterNotification('blog', updatedBlog);
      } catch (error) {
        console.error('Failed to send newsletter notification:', error);
        // Don't throw error, just log it
      }
    }
    
    // Invalidate related cache
    await invalidateRelatedCache('blog', id);
    
    res.status(200).json({
      status: 'success',
      data: {
        blog: updatedBlog,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to update blog: ${(error as Error).message}`, 500);
  }
};

/**
 * Delete a blog
 */
export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByIdAndDelete(id);
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }
    
    // Invalidate related cache
    await invalidateRelatedCache('blog', id);
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to delete blog: ${(error as Error).message}`, 500);
  }
};

/**
 * Toggle blog featured status
 */
export const toggleFeatured = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }
    
    blog.featured = !blog.featured;
    await blog.save();
    
    // Invalidate related cache
    await invalidateRelatedCache('blog', id);
    
    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to toggle featured status: ${(error as Error).message}`, 500);
  }
};

/**
 * Toggle blog published status
 */
export const togglePublished = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }
    
    const wasPublished = blog.published;
    blog.published = !blog.published;
    await blog.save();
    
    // If the blog is being published for the first time, send newsletter notification
    if (!wasPublished && blog.published) {
      try {
        sendNewsletterNotification('blog', blog);
      } catch (error) {
        console.error('Failed to send newsletter notification:', error);
        // Don't throw error, just log it
      }
    }
    
    // Invalidate related cache
    await invalidateRelatedCache('blog', id);
    
    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to toggle published status: ${(error as Error).message}`, 500);
  }
}; 