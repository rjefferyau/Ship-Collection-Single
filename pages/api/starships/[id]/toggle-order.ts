import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  console.log(`Toggle order API called for ID: ${id}, Method: ${req.method}`);
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    console.log('Connected to MongoDB');
    
    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    
    const { onOrder, pricePaid, orderDate } = req.body;
    
    // Find the starship using the Mongoose model
    console.log(`Looking for starship with ID: ${id}`);
    
    const starship = await Starship.findById(id);
    
    if (!starship) {
      console.log(`Starship not found with ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    console.log(`Starship found: ${starship.shipName}`);
    
    // Update the starship
    if (onOrder) {
      starship.onOrder = true;
      starship.pricePaid = pricePaid || undefined;
      starship.orderDate = orderDate ? new Date(orderDate) : new Date();
      
      // If it was on the wishlist, remove it from the wishlist
      if (starship.wishlist) {
        starship.wishlist = false;
        starship.wishlistPriority = undefined;
      }
    } else {
      // If removing from order, clear the price paid and order date
      starship.onOrder = false;
      starship.pricePaid = undefined;
      starship.orderDate = undefined;
      
      // Add it back to the wishlist
      starship.wishlist = true;
      
      // Find the highest priority in the wishlist to add this at the end
      const highestPriorityDoc = await Starship.findOne({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1);
      
      // Set the priority to one more than the highest, or 1 if there are no wishlist items
      starship.wishlistPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
        ? highestPriorityDoc.wishlistPriority + 1 
        : 1;
    }
    
    console.log(`Updating starship: ${starship.shipName}`);
    
    // Save the updated starship
    await starship.save();
    
    console.log(`Starship updated successfully`);
    
    return res.status(200).json({ 
      success: true, 
      message: onOrder ? 'Starship marked as on order' : 'Starship removed from orders and added to wishlist',
      data: starship 
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating order status' });
  }
} 