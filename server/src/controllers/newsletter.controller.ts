import { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import NewsletterSubscriber from '../schema/newsletter.schema';
import { sendEmail } from '../config/nodemailer';
import {
  getBlogNewsletterTemplate,
  getProjectNewsletterTemplate,
  getGalleryNewsletterTemplate,
  getWelcomeNewsletterTemplate
} from '../templates/newsletter.template';

/**
 * Get all newsletter subscribers (admin only)
 */
export const getAllSubscribers = async (req: Request, res: Response) => {
  try {
    const { active, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query: any = {};
    
    if (active) {
      query.active = active === 'true';
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const subscribers = await NewsletterSubscriber.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count
    const total = await NewsletterSubscriber.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: subscribers.length,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: {
        subscribers,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to get subscribers: ${(error as Error).message}`, 500);
  }
};

/**
 * Subscribe to newsletter
 */
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    // Validate email
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    
    // Check if already subscribed
    const existingSubscriber = await NewsletterSubscriber.findOne({ email });
    
    if (existingSubscriber) {
      // If already subscribed but inactive, reactivate
      if (!existingSubscriber.active) {
        existingSubscriber.active = true;
        await existingSubscriber.save();
        
        // Send welcome back email
        try {
          const unsubscribeUrl = `${process.env.API_URL}/api/newsletter/unsubscribe/${existingSubscriber.unsubscribeToken}`;
          await sendEmail(
            email,
            'Welcome back to Caleb\'s Newsletter',
            getWelcomeNewsletterTemplate(unsubscribeUrl)
          );
        } catch (error) {
          console.error('Failed to send welcome back email:', error);
          // Don't throw error, just log it
        }
        
        return res.status(200).json({
          status: 'success',
          message: 'Your subscription has been reactivated',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'You are already subscribed to the newsletter',
      });
    }
    
    // Create new subscriber
    const newSubscriber = await NewsletterSubscriber.create({
      email,
      name,
    });
    
    // Send welcome email
    try {
      const unsubscribeUrl = `${process.env.API_URL}/api/newsletter/unsubscribe/${newSubscriber.unsubscribeToken}`;
      await sendEmail(
        email,
        'Welcome to Caleb\'s Newsletter',
        getWelcomeNewsletterTemplate(unsubscribeUrl)
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error, just log it
    }
    
    res.status(201).json({
      status: 'success',
      message: 'You have successfully subscribed to the newsletter',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to subscribe: ${(error as Error).message}`, 500);
  }
};

/**
 * Unsubscribe from newsletter
 */
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });
    
    if (!subscriber) {
      throw new AppError('Invalid unsubscribe token', 400);
    }
    
    subscriber.active = false;
    await subscriber.save();
    
    res.status(200).json({
      status: 'success',
      message: 'You have successfully unsubscribed from the newsletter',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to unsubscribe: ${(error as Error).message}`, 500);
  }
};

/**
 * Delete subscriber (admin only)
 */
export const deleteSubscriber = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const subscriber = await NewsletterSubscriber.findByIdAndDelete(id);
    
    if (!subscriber) {
      throw new AppError('Subscriber not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to delete subscriber: ${(error as Error).message}`, 500);
  }
};

/**
 * Send newsletter to all active subscribers
 */
export const sendNewsletterToAll = async (req: Request, res: Response) => {
  try {
    const { subject, content } = req.body;
    
    if (!subject || !content) {
      throw new AppError('Subject and content are required', 400);
    }
    
    // Get all active subscribers
    const subscribers = await NewsletterSubscriber.find({ active: true });
    
    if (subscribers.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No active subscribers found',
      });
    }
    
    // Send email to each subscriber
    let successCount = 0;
    let failureCount = 0;
    
    // Send emails in parallel
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const unsubscribeUrl = `${process.env.API_URL}/api/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
        await sendEmail(
          subscriber.email, 
          subject, 
          content + `<p>If you wish to unsubscribe, <a href="${unsubscribeUrl}">click here</a>.</p>`
        );
        return { success: true };
      } catch (error) {
        console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
        return { success: false };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && (result.value as any).success) {
        successCount++;
      } else {
        failureCount++;
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: `Newsletter sent to ${successCount} subscribers (${failureCount} failed)`,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to send newsletter: ${(error as Error).message}`, 500);
  }
};

/**
 * Send notification to subscribers when new content is added
 * @param contentType Type of content (blog, project, gallery)
 * @param content The content object
 */
export const sendNewsletterNotification = async (contentType: 'blog' | 'project' | 'gallery', content: any) => {
  try {
    // Get all active subscribers
    const subscribers = await NewsletterSubscriber.find({ active: true });
    
    if (subscribers.length === 0) {
      console.log('No active subscribers found');
      return;
    }
    
    let subject = '';
    
    // Prepare email content based on content type
    if (contentType === 'blog') {
      subject = `New Blog Post: ${content.title}`;
    } else if (contentType === 'project') {
      subject = `New Project: ${content.title}`;
    } else if (contentType === 'gallery') {
      subject = `New Gallery Addition: ${content.title}`;
    }
      
    // Send emails in parallel
    const emailPromises = subscribers.map(async (subscriber) => {
      const unsubscribeUrl = `${process.env.API_URL}/api/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
      let itemTemplate = '';
      
      if (contentType === 'blog') {
        itemTemplate = getBlogNewsletterTemplate(content, unsubscribeUrl);
      } else if (contentType === 'project') {
        itemTemplate = getProjectNewsletterTemplate(content, unsubscribeUrl);
      } else if (contentType === 'gallery') {
        itemTemplate = getGalleryNewsletterTemplate(content, unsubscribeUrl);
      }
      
      try {
        await sendEmail(subscriber.email, subject, itemTemplate);
      } catch (error) {
        console.error(`Failed to send ${contentType} notification to ${subscriber.email}:`, error);
      }
    });

    await Promise.allSettled(emailPromises);
    
    console.log(`Newsletter notification sent for new ${contentType}`);
  } catch (error) {
    console.error(`Failed to send newsletter notification for ${contentType}:`, error);
    throw error;
  }
}; 