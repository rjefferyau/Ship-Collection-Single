import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  console.log(`Cycle status API called for ID: ${id}, Method: ${req.method}`);
  
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
    
    // Try to find the starship using the Starship model
    console.log(`Looking for starship with ID: ${id}`);
    
    // First try to find by direct ID
    let starship = await Starship.findById(id);
    
    // If not found, check if it's an old ID
    if (!starship && mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Starship not found with ID ${id}, checking if it's an old ID...`);
      
      // Try to find by originalId
      starship = await Starship.findOne({ originalId: new mongoose.Types.ObjectId(id) });
      
      // If still not found, check the ID mapping collection
      if (!starship) {
        const idMappingCollection = mongoose.connection.collection('starshipIdMapping');
        const mapping = await idMappingCollection.findOne({ oldId: new mongoose.Types.ObjectId(id) });
        
        if (mapping) {
          console.log(`Found ID mapping: ${id} -> ${mapping.newId}`);
          starship = await Starship.findById(mapping.newId);
        }
      }
    }
    
    if (!starship) {
      console.log(`Starship not found with ID ${id} or as originalId`);
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    console.log(`Found starship: ${starship._id}`);
    
    // If the starship is owned, we don't change the status
    if (starship.owned) {
      console.log('Cannot change status of owned starships');
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change status of owned starships' 
      });
    }
    
    let message = '';
    
    // Cycle through states: not on wishlist → on wishlist → on order → not on wishlist
    if (!starship.wishlist && !starship.onOrder) {
      // Not on wishlist → Add to wishlist
      starship.wishlist = true;
      
      // Set a default priority if not already set
      const highestPriorityDoc = await Starship.findOne({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1);
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
        ? highestPriorityDoc.wishlistPriority + 1 
        : 1;
      
      starship.wishlistPriority = nextPriority;
      message = 'Added to wishlist';
    } 
    else if (starship.wishlist && !starship.onOrder) {
      // On wishlist → Mark as on order
      starship.wishlist = false;
      starship.wishlistPriority = undefined;
      starship.onOrder = true;
      starship.orderDate = new Date();
      
      // Use retail price as default price paid if available
      if (starship.retailPrice) {
        starship.pricePaid = starship.retailPrice;
      }
      
      message = 'Marked as on order';
    }
    else if (starship.onOrder) {
      // On order → Remove from order and wishlist
      starship.onOrder = false;
      starship.pricePaid = undefined;
      starship.orderDate = undefined;
      starship.wishlist = false;
      starship.wishlistPriority = undefined;
      
      message = 'Removed from orders and wishlist';
    }
    
    console.log(`Updating starship ${starship._id}`);
    
    // Save the updated starship
    await starship.save();
    
    console.log(`Starship updated successfully`);
    
    return res.status(200).json({ 
      success: true, 
      message,
      data: starship 
    });
  } catch (error: any) {
    console.error('Error cycling status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error cycling status' });
  }
} 