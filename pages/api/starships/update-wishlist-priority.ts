import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id, priority } = req.body;
    
    if (!id || priority === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: id and priority' 
      });
    }
    
    // Validate the starship exists
    const starship = await DatabaseService.findStarshipById(id);
    
    // Update the priority using the database service
    await DatabaseService.updateStarship(id, { wishlistPriority: priority });
    
    // Get the updated document
    const updatedDoc = await DatabaseService.getUpdatedStarship(id);
    
    return res.status(200).json({ 
      success: true, 
      data: {
        _id: updatedDoc._id,
        shipName: updatedDoc.shipName,
        wishlistPriority: updatedDoc.wishlistPriority
      },
      message: 'Wishlist priority updated'
    });
  } catch (error: any) {
    console.error('Error updating wishlist priority:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    return res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 