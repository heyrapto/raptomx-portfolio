import { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import Project from '../schema/project.schema';
import { sendNewsletterNotification } from './newsletter.controller';
import cloudinary from '../config/cloudinary';
import { invalidateRelatedCache } from '../middleware/cache.middleware';

/**
 * Get all projects
 */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { category, technology, featured, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (technology) {
      query.technologies = { $in: [technology] };
    }
    
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count
    const total = await Project.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: projects.length,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: {
        projects,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to get projects: ${(error as Error).message}`, 500);
  }
};

/**
 * Get a single project by ID or slug
 */
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let project;
    if (isValidObjectId) {
      project = await Project.findById(id);
    } else {
      // If not a valid ObjectId, try to find by slug
      project = await Project.findOne({ slug: id });
    }
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        project,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to get project: ${(error as Error).message}`, 500);
  }
};

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      technologies,
      images,
      githubUrl,
      liveUrl,
      featured,
      approach,
      challenges,
      features,
    } = req.body;
    
    // Create new project
    const newProject = await Project.create({
      title,
      description,
      category,
      technologies: technologies ? JSON.parse(technologies) : [],
      images: images ? JSON.parse(images) : [],
      githubUrl,
      liveUrl,
      featured: featured === 'true',
      approach,
      challenges,
      features: features ? JSON.parse(features) : [],
    });
    
    // Send newsletter notification
    try {
      sendNewsletterNotification('project', newProject);
    } catch (error) {
      console.error('Failed to send newsletter notification:', error);
      // Don't throw error, just log it
    }
    
    // Invalidate related cache
    await invalidateRelatedCache('project', newProject.id);
    
    res.status(201).json({
      status: 'success',
      data: {
        project: newProject,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to create project: ${(error as Error).message}`, 500);
  }
};

/**
 * Update a project
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      technologies,
      images,
      githubUrl,
      liveUrl,
      featured,
      approach,
      challenges,
      features,
    } = req.body;
    
    // Find project
    const project = await Project.findById(id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
        technologies: technologies ? JSON.parse(technologies) : project.technologies,
        images: images ? JSON.parse(images) : project.images,
        githubUrl,
        liveUrl,
        featured: featured === 'true',
        approach,
        challenges,
        features: features ? JSON.parse(features) : project.features,
      },
      { new: true, runValidators: true }
    );
    
    // Invalidate related cache
    await invalidateRelatedCache('project', id);
    
    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to update project: ${(error as Error).message}`, 500);
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findById(id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    // Delete images from Cloudinary if they exist
    if (project.images && project.images.length > 0) {
      for (const image of project.images) {
        if (image.cloudinaryId) {
          await cloudinary.uploader.destroy(image.cloudinaryId);
        }
      }
    }
    
    await Project.findByIdAndDelete(id);
    
    // Invalidate related cache
    await invalidateRelatedCache('project', id);
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to delete project: ${(error as Error).message}`, 500);
  }
};

/**
 * Toggle project featured status
 */
export const toggleFeatured = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findById(id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    project.featured = !project.featured;
    await project.save();
    
    // Invalidate related cache
    await invalidateRelatedCache('project', id);
    
    // Invalidate related cache
    await invalidateRelatedCache('landing_page');
    
    res.status(200).json({
      status: 'success',
      data: {
        project,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to toggle featured status: ${(error as Error).message}`, 500);
  }
}; 