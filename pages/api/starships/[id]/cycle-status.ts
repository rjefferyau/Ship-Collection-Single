import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { direction = 'forward' } = req.body; // Default to forward direction
  
  console.log(`Cycle status API called for ID: ${id}, Method: ${req.method}, Direction: ${direction}`);
  
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
    
    // Try to find the starship
    console.log(`Looking for starship with ID: ${id}`);
    const starship = await Starship.findById(id);
    
    if (!starship) {
      console.log(`Starship not found with ID ${id}`);
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    console.log(`Found starship: ${starship._id}, Current state: owned=${starship.owned}, wishlist=${starship.wishlist}, onOrder=${starship.onOrder}, notInterested=${starship.notInterested}`);
    
    // If the starship is in a neutral state (not owned, not on wishlist, not on order, and not marked as not interested),
    // mark it as not interested first
    if (!starship.owned && !starship.wishlist && !starship.onOrder && !starship.notInterested) {
      starship.notInterested = true;
      await starship.save();
      console.log(`Starship ${starship._id} was in neutral state, marked as not interested`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Marked as not interested',
        data: starship 
      });
    }
    
    let message = '';
    
    if (direction === 'forward') {
      // Forward cycle: not interested → wishlist → on order → owned → not interested
      if (starship.notInterested) {
        // If not interested, cycle to wishlist
        starship.notInterested = false;
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
      else if (starship.owned) {
        // If owned, cycle to not interested
        starship.owned = false;
        starship.notInterested = true;
        message = 'Marked as not interested';
      }
      else if (starship.onOrder) {
        // On order → Mark as owned
        starship.onOrder = false;
        starship.owned = true;
        message = 'Marked as owned';
      }
      else if (starship.wishlist) {
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
      else {
        // Neutral state → Mark as not interested
        starship.notInterested = true;
        message = 'Marked as not interested';
      }
    } else {
      // Backward cycle: neutral → owned → on order → wishlist → not interested → neutral
      if (starship.notInterested) {
        // If not interested, cycle to neutral state
        starship.notInterested = false;
        message = 'Removed from not interested';
      }
      else if (starship.owned) {
        // Owned → Not owned
        starship.owned = false;
        message = 'Unmarked as owned';
      }
      else if (starship.onOrder) {
        // On order → Back to wishlist
        starship.onOrder = false;
        starship.orderDate = undefined;
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
        message = 'Moved back to wishlist';
      }
      else if (starship.wishlist) {
        // On wishlist → Mark as not interested
        starship.wishlist = false;
        starship.wishlistPriority = undefined;
        starship.notInterested = true;
        message = 'Marked as not interested';
      }
      else {
        // Neutral state → Mark as owned
        starship.owned = true;
        message = 'Marked as owned';
      }
    }
    
    console.log(`Updating starship ${starship._id}, New state: owned=${starship.owned}, wishlist=${starship.wishlist}, onOrder=${starship.onOrder}, notInterested=${starship.notInterested}`);
    
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