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
    
    // Try to find the starship using raw MongoDB queries
    console.log(`Looking for starship with ID: ${id}`);
    
    // Get the raw MongoDB connection
    const db = mongoose.connection.db;
    
    // Try to find the document in starshipv4 collection
    let rawDoc = await db.collection('starshipv4').findOne({ _id: id as any });
    let collectionName = 'starshipv4';
    
    if (!rawDoc) {
      console.log(`Document not found in starshipv4, trying starshipv3 collection`);
      // Try to find the document in starshipv3 collection
      rawDoc = await db.collection('starshipv3').findOne({ _id: id as any });
      collectionName = 'starshipv3';
    }
    
    if (!rawDoc) {
      console.log(`Starship not found in any collection`);
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    console.log(`Document found in ${collectionName}: ${rawDoc._id}`);
    
    // If the starship is owned, we don't change the status
    if (rawDoc.owned) {
      console.log('Cannot change status of owned starships');
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change status of owned starships' 
      });
    }
    
    let message = '';
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Cycle through states: not on wishlist → on wishlist → on order → not on wishlist
    if (!rawDoc.wishlist && !rawDoc.onOrder) {
      // Not on wishlist → Add to wishlist
      updateData.wishlist = true;
      
      // Set a default priority if not already set
      const highestPriorityDoc = await db.collection(collectionName)
        .find({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1)
        .toArray();
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriorityDoc.length > 0 && highestPriorityDoc[0].wishlistPriority 
        ? highestPriorityDoc[0].wishlistPriority + 1 
        : 1;
      
      updateData.wishlistPriority = nextPriority;
      message = 'Added to wishlist';
    } 
    else if (rawDoc.wishlist && !rawDoc.onOrder) {
      // On wishlist → Mark as on order
      updateData.wishlist = false;
      updateData.wishlistPriority = null;
      updateData.onOrder = true;
      updateData.orderDate = new Date();
      
      // Use retail price as default price paid if available
      if (rawDoc.retailPrice) {
        updateData.pricePaid = rawDoc.retailPrice;
      }
      
      message = 'Marked as on order';
    }
    else if (rawDoc.onOrder) {
      // On order → Remove from order and wishlist
      updateData.onOrder = false;
      updateData.pricePaid = null;
      updateData.orderDate = null;
      updateData.wishlist = false;
      updateData.wishlistPriority = null;
      
      message = 'Removed from orders and wishlist';
    }
    
    console.log(`Updating document in ${collectionName}`);
    
    // Update the document
    const result = await db.collection(collectionName).updateOne(
      { _id: id as any },
      { $set: updateData }
    );
    
    console.log(`Update result: ${result.modifiedCount} document(s) modified`);
    
    // Get the updated document
    const updatedDoc = await db.collection(collectionName).findOne({ _id: id as any });
    
    return res.status(200).json({ 
      success: true, 
      message,
      data: updatedDoc 
    });
  } catch (error: any) {
    console.error('Error cycling status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error cycling status' });
  }
} 