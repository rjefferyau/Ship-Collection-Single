import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  console.log(`Toggle order API called for ID: ${id}, Method: ${req.method}`);
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    
    const { onOrder, pricePaid, orderDate } = req.body;
    
    console.log(`Looking for starship with ID: ${id}`);
    const starship = await DatabaseService.findStarshipById(id);
    
    console.log(`Starship found: ${starship.shipName}`);
    
    // Prepare update operations
    let updateFields: any = {};
    
    if (onOrder) {
      updateFields.onOrder = true;
      updateFields.pricePaid = pricePaid || null;
      updateFields.orderDate = orderDate ? new Date(orderDate) : new Date();
      
      // If it was on the wishlist, remove it from the wishlist
      if (starship.wishlist) {
        updateFields.wishlist = false;
        updateFields.wishlistPriority = null;
      }
    } else {
      // If removing from order, clear the price paid and order date
      updateFields.onOrder = false;
      updateFields.pricePaid = null;
      updateFields.orderDate = null;
      
      // Add it back to the wishlist
      updateFields.wishlist = true;
      
      // Get the next available priority
      const nextPriority = await DatabaseService.getNextWishlistPriority();
      updateFields.wishlistPriority = nextPriority;
    }
    
    console.log(`Updating starship: ${starship.shipName}`);
    
    // Update the document using the database service
    await DatabaseService.updateStarship(id, updateFields);
    
    console.log(`Starship updated successfully`);
    
    // Get the updated document
    const updatedStarship = await DatabaseService.getUpdatedStarship(id);
    
    return res.status(200).json({ 
      success: true, 
      message: onOrder ? 'Starship marked as on order' : 'Starship removed from orders and added to wishlist',
      data: updatedStarship 
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating order status' });
  }
} 