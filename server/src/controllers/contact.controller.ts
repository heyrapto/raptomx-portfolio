import { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import Contact from '../schema/contact.schema';
import { sendEmail } from '../config/nodemailer';

/**
 * Get all contact messages (admin only)
 */
export const getAllContactMessages = async (req: Request, res: Response) => {
  try {
    const { read, archived, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query: any = {};
    
    if (read) {
      query.read = read === 'true';
    }
    
    if (archived) {
      query.archived = archived === 'true';
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count
    const total = await Contact.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: messages.length,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: {
        messages,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to get contact messages: ${(error as Error).message}`, 500);
  }
};

/**
 * Get a single contact message (admin only)
 */
export const getContactMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await Contact.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    // Mark as read if not already
    if (!message.read) {
      message.read = true;
      await message.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to get contact message: ${(error as Error).message}`, 500);
  }
};

/**
 * Submit a new contact message (public)
 */
export const submitContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      throw new AppError('Please provide name, email, subject and message', 400);
    }
    
    // Create new contact message
    const newMessage = await Contact.create({
      name,
      email,
      subject,
      message,
    });
    
    // Send notification email to admin
    try {
      const adminEmail = process.env.EMAIL_USER as string;
      const emailSubject = `New Contact Form Submission: ${subject}`;
      const emailContent = `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><a href="${process.env.API_URL}/dashboard/contacts">View in Dashboard</a></p>
      `;
      
      sendEmail(adminEmail, emailSubject, emailContent);
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
      // Don't throw error, just log it
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to submit contact message: ${(error as Error).message}`, 500);
  }
};

/**
 * Mark a message as read/unread (admin only)
 */
export const toggleReadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await Contact.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    message.read = !message.read;
    await message.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to toggle read status: ${(error as Error).message}`, 500);
  }
};

/**
 * Mark a message as archived/unarchived (admin only)
 */
export const toggleArchivedStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await Contact.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    message.archived = !message.archived;
    await message.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to toggle archived status: ${(error as Error).message}`, 500);
  }
};

/**
 * Delete a message (admin only)
 */
export const deleteContactMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await Contact.findByIdAndDelete(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to delete contact message: ${(error as Error).message}`, 500);
  }
}; 