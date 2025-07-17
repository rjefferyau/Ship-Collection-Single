import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';

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
    
    // Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid MongoDB ObjectId format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ObjectId format' });
    }
    
    // Use direct collection access
    const collection = mongoose.connection.collection('starshipv5');
    
    console.log(`Looking for starship with ID: ${id}`);
    let starship = await collection.findOne({ _id: id });
    
    if (!starship) {
      console.log(`Starship not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: `Starship not found with ID: ${id}`
      });
    }
    
    console.log(`Found starship: ${starship._id}, Current state: owned=${starship.owned}, wishlist=${starship.wishlist}, onOrder=${starship.onOrder}, notInterested=${starship.notInterested}`);
    
    // If the starship is in a neutral state (not owned, not on wishlist, not on order, and not marked as not interested),
    // mark it as not interested first
    if (!starship.owned && !starship.wishlist && !starship.onOrder && !starship.notInterested) {
      const updateResult = await collection.updateOne(
        { _id: id },
        { $set: { notInterested: true, updatedAt: new Date() } }
      );
      
      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ success: false, message: 'Update failed' });
      }
      
      console.log(`Starship ${starship._id} was in neutral state, marked as not interested`);
      
      // Get the updated document
      const updatedStarship = await collection.findOne({ _id: id });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Marked as not interested',
        data: {
          ...updatedStarship,
          _id: updatedStarship._id.toString()
        }
      });
    }
    
    let message = '';
    let updateFields = {};
    
    if (direction === 'forward') {
      // Forward cycle: not interested → wishlist → on order → owned → not interested
      if (starship.notInterested) {
        // If not interested, cycle to wishlist
        
        // Set a default priority if not already set
        const highestPriorityDoc = await collection.findOne(
          { wishlist: true },
          { sort: { wishlistPriority: -1 }, limit: 1 }
        );
        
        // Set the new priority to be one higher than the current highest
        const nextPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
          ? highestPriorityDoc.wishlistPriority + 1 
          : 1;
        
        updateFields = {
          notInterested: false,
          wishlist: true,
          wishlistPriority: nextPriority,
          updatedAt: new Date()
        };
        message = 'Added to wishlist';
      }
      else if (starship.owned) {
        // If owned, cycle to not interested
        updateFields = {
          owned: false,
          notInterested: true,
          updatedAt: new Date()
        };
        message = 'Marked as not interested';
      }
      else if (starship.onOrder) {
        // On order → Mark as owned
        updateFields = {
          onOrder: false,
          owned: true,
          updatedAt: new Date()
        };
        message = 'Marked as owned';
      }
      else if (starship.wishlist) {
        // On wishlist → Mark as on order
        updateFields = {
          wishlist: false,
          wishlistPriority: null,
          onOrder: true,
          orderDate: new Date(),
          updatedAt: new Date()
        };
        
        // Use retail price as default price paid if available
        if (starship.retailPrice) {
          updateFields.pricePaid = starship.retailPrice;
        }
        
        message = 'Marked as on order';
      }
      else {
        // Neutral state → Mark as not interested
        updateFields = {
          notInterested: true,
          updatedAt: new Date()
        };
        message = 'Marked as not interested';
      }
    } else {
      // Backward cycle: neutral → owned → on order → wishlist → not interested → neutral
      if (starship.notInterested) {
        // If not interested, cycle to neutral state
        updateFields = {
          notInterested: false,
          updatedAt: new Date()
        };
        message = 'Removed from not interested';
      }
      else if (starship.owned) {
        // Owned → Not owned
        updateFields = {
          owned: false,
          updatedAt: new Date()
        };
        message = 'Unmarked as owned';
      }
      else if (starship.onOrder) {
        // On order → Back to wishlist
        
        // Set a default priority if not already set
        const highestPriorityDoc = await collection.findOne(
          { wishlist: true },
          { sort: { wishlistPriority: -1 }, limit: 1 }
        );
        
        // Set the new priority to be one higher than the current highest
        const nextPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
          ? highestPriorityDoc.wishlistPriority + 1 
          : 1;
        
        updateFields = {
          onOrder: false,
          orderDate: null,
          wishlist: true,
          wishlistPriority: nextPriority,
          updatedAt: new Date()
        };
        message = 'Moved back to wishlist';
      }
      else if (starship.wishlist) {
        // On wishlist → Mark as not interested
        updateFields = {
          wishlist: false,
          wishlistPriority: null,
          notInterested: true,
          updatedAt: new Date()
        };
        message = 'Marked as not interested';
      }
      else {
        // Neutral state → Mark as owned
        updateFields = {
          owned: true,
          updatedAt: new Date()
        };
        message = 'Marked as owned';
      }
    }
    
    console.log(`Updating starship ${starship._id}`);
    
    // Update the document directly
    const result = await collection.updateOne(
      { _id: id },
      { $set: updateFields }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: 'Update failed' });
    }
    
    console.log(`Starship updated successfully`);
    
    // Get the updated document
    const updatedStarship = await collection.findOne({ _id: id });
    
    return res.status(200).json({ 
      success: true, 
      message,
      data: {
        ...updatedStarship,
        _id: updatedStarship._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Error cycling status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error cycling status' });
  }
} 