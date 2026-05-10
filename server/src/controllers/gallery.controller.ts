import { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import Gallery from '../schema/gallery.schema';
import cloudinary from '../config/cloudinary';
import { sendNewsletterNotification } from './newsletter.controller';
import { invalidateRelatedCache } from '../middleware/cache.middleware';

/**
 * Get all gallery items
 */
export const getAllGalleryItems = async (req: Request, res: Response) => {
  try {
    const { category, featured, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const galleryItems = await Gallery.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count
    const total = await Gallery.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: galleryItems.length,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: {
        gallery: galleryItems,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to get gallery items: ${(error as Error).message}`, 500);
  }
};

/**
 * Get a single gallery item
 */
export const getGalleryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      throw new AppError('Gallery item not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        gallery: galleryItem,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to get gallery item: ${(error as Error).message}`, 500);
  }
};

/**
 * Create a new gallery item
 */
export const createGalleryItem = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      imageUrl,
      cloudinaryId,
      order,
      featured,
    } = req.body;
    
    // Create new gallery item
    const newGalleryItem = await Gallery.create({
      title,
      description,
      category,
      imageUrl,
      cloudinaryId,
      order: Number(order) || 0,
      featured: featured === 'true',
    });
    
    // Send newsletter notification
    try {
      sendNewsletterNotification('gallery', newGalleryItem);
    } catch (error) {
      console.error('Failed to send newsletter notification:', error);
      // Don't throw error, just log it
    }
    
    // Invalidate related cache
    await invalidateRelatedCache('gallery', newGalleryItem.id);
    
    res.status(201).json({
      status: 'success',
      data: {
        gallery: newGalleryItem,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to create gallery item: ${(error as Error).message}`, 500);
  }
};

/**
 * Update a gallery item
 */
export const updateGalleryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      imageUrl,
      cloudinaryId,
      order,
      featured,
    } = req.body;
    
    // Find gallery item
    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      throw new AppError('Gallery item not found', 404);
    }
    
    // Update gallery item
    const updatedGalleryItem = await Gallery.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
        imageUrl,
        cloudinaryId,
        order: Number(order) || galleryItem.order,
        featured: featured === 'true',
      },
      { new: true, runValidators: true }
    );
    
    // Invalidate related cache
    await invalidateRelatedCache('gallery', id);
    
    res.status(200).json({
      status: 'success',
      data: {
        gallery: updatedGalleryItem,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to update gallery item: ${(error as Error).message}`, 500);
  }
};

/**
 * Delete a gallery item
 */
export const deleteGalleryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      throw new AppError('Gallery item not found', 404);
    }
    
    // Delete image from Cloudinary if it exists
    if (galleryItem.cloudinaryId) {
      await cloudinary.uploader.destroy(galleryItem.cloudinaryId);
    }
    
    await Gallery.findByIdAndDelete(id);
    
    // Invalidate related cache
    await invalidateRelatedCache('gallery', id);
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to delete gallery item: ${(error as Error).message}`, 500);
  }
};

/**
 * Toggle gallery item featured status
 */
export const toggleFeatured = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      throw new AppError('Gallery item not found', 404);
    }
    
    galleryItem.featured = !galleryItem.featured;
    await galleryItem.save();
    
    // Invalidate related cache
    await invalidateRelatedCache('gallery', id);
    
    // Invalidate related cache
    await invalidateRelatedCache('gallery', id);
    
    // Invalidate related cache
    await invalidateRelatedCache('landing_page');
    
    // Invalidate related cache
    await invalidateRelatedCache('landing_page');
    
    res.status(200).json({
      status: 'success',
      data: {
        gallery: galleryItem,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to toggle featured status: ${(error as Error).message}`, 500);
  }
}; 