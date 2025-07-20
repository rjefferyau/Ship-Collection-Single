import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  console.log(`Toggle owned API called for ID: ${id}, Method: ${method}`);

  try {
    if (method !== 'PUT') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }

    // Find the starship
    console.log(`Looking for starship with ID: ${id}`);
    const starship = await DatabaseService.findStarshipById(id);
    
    console.log(`Found starship: ${starship._id}`);
    
    // Toggle the owned status
    console.log(`Current owned status: ${starship.owned}, toggling to: ${!starship.owned}`);
    const newOwnedStatus = !starship.owned;
    
    // Prepare update fields
    const updateFields: any = {
      owned: newOwnedStatus
    };
    
    // If marking as owned, clear wishlist and on-order status
    if (newOwnedStatus) {
      updateFields.wishlist = false;
      updateFields.wishlistPriority = null;
      updateFields.onOrder = false;
      updateFields.orderDate = null;
      updateFields.pricePaid = null;
    }
    
    console.log(`Updating starship with fields:`, updateFields);
    
    // Update the starship using the database service
    await DatabaseService.updateStarship(id, updateFields);
    
    console.log(`Starship updated successfully`);
    
    // Get the updated document
    const updatedStarship = await DatabaseService.getUpdatedStarship(id);
    
    res.status(200).json({ success: true, data: updatedStarship });
  } catch (error: any) {
    console.error('Error in toggle-owned API:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 