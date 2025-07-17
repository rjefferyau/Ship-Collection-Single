import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  console.log(`Toggle wishlist API called for ID: ${id}, Method: ${method}`);

  try {
    if (method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }

    console.log(`Looking for starship with ID: ${id}`);
    const starship = await DatabaseService.findStarshipById(id);
    
    console.log(`Found starship: ${starship._id}`);
    
    // Toggle the wishlist status
    console.log(`Current wishlist status: ${starship.wishlist}, toggling to: ${!starship.wishlist}`);
    const newWishlistStatus = !starship.wishlist;
    
    // Prepare update fields
    let updateFields: any = {
      wishlist: newWishlistStatus
    };
    
    // If adding to wishlist, set a default priority if not already set
    if (newWishlistStatus && !starship.wishlistPriority) {
      console.log(`Adding to wishlist, setting priority`);
      
      const nextPriority = await DatabaseService.getNextWishlistPriority();
      console.log(`Setting wishlist priority to: ${nextPriority}`);
      updateFields.wishlistPriority = nextPriority;
    }
    
    // If removing from wishlist, clear the priority
    if (!newWishlistStatus) {
      console.log(`Removing from wishlist, clearing priority`);
      updateFields.wishlistPriority = null;
    }
    
    console.log(`Updating starship ${starship._id}`);
    
    // Update the document using the database service
    await DatabaseService.updateStarship(id, updateFields);
    
    console.log(`Starship updated successfully`);
    
    // Get the updated document
    const updatedStarship = await DatabaseService.getUpdatedStarship(id);
    
    return res.status(200).json({ 
      success: true, 
      data: updatedStarship,
      message: newWishlistStatus ? 'Added to wishlist' : 'Removed from wishlist'
    });
  } catch (error: any) {
    console.error('Error toggling wishlist status:', error);
    return res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 