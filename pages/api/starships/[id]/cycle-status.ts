import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { direction = 'forward' } = req.body; // Default to forward direction
  
  console.log(`Cycle status API called for ID: ${id}, Method: ${req.method}, Direction: ${direction}`);
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    
    console.log(`Looking for starship with ID: ${id}`);
    const starship = await DatabaseService.findStarshipById(id);
    
    console.log(`Found starship: ${starship._id}, Current state: owned=${starship.owned}, wishlist=${starship.wishlist}, onOrder=${starship.onOrder}, notInterested=${starship.notInterested}`);
    
    // If the starship is in a neutral state (not owned, not on wishlist, not on order, and not marked as not interested),
    // mark it as not interested first
    if (!starship.owned && !starship.wishlist && !starship.onOrder && !starship.notInterested) {
      await DatabaseService.updateStarship(id, { notInterested: true });
      
      console.log(`Starship ${starship._id} was in neutral state, marked as not interested`);
      
      // Get the updated document
      const updatedStarship = await DatabaseService.getUpdatedStarship(id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Marked as not interested',
        data: updatedStarship
      });
    }
    
    // Calculate the status cycle transition using the database service
    const { updateFields, message } = await DatabaseService.calculateStatusCycle(starship, direction);
    
    console.log(`Updating starship ${starship._id} with direction: ${direction}`);
    
    // Update the document using the database service
    await DatabaseService.updateStarship(id, updateFields);
    
    console.log(`Starship updated successfully`);
    
    // Get the updated document
    const updatedStarship = await DatabaseService.getUpdatedStarship(id);
    
    return res.status(200).json({ 
      success: true, 
      message,
      data: updatedStarship
    });
  } catch (error: any) {
    console.error('Error cycling status:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    return res.status(500).json({ success: false, message: error.message || 'Error cycling status' });
  }
}