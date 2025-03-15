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
    
    // Prepare the update
    const updateData: any = { 
      onOrder: onOrder,
      updatedAt: new Date()
    };
    
    // If marking as on order, update the price paid and order date
    if (onOrder) {
      updateData.pricePaid = pricePaid;
      updateData.orderDate = orderDate ? new Date(orderDate) : new Date();
      
      // If it was on the wishlist, remove it from the wishlist
      if (rawDoc.wishlist) {
        updateData.wishlist = false;
        updateData.wishlistPriority = null;
      }
    } else {
      // If removing from order, clear the price paid and order date
      updateData.pricePaid = null;
      updateData.orderDate = null;
      
      // Add it back to the wishlist
      updateData.wishlist = true;
      
      // Find the highest priority in the wishlist to add this at the end
      const highestPriorityDoc = await db.collection(collectionName)
        .find({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1)
        .toArray();
      
      // Set the priority to one more than the highest, or 1 if there are no wishlist items
      updateData.wishlistPriority = highestPriorityDoc.length > 0 && highestPriorityDoc[0].wishlistPriority 
        ? highestPriorityDoc[0].wishlistPriority + 1 
        : 1;
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
      message: onOrder ? 'Starship marked as on order' : 'Starship removed from orders and added to wishlist',
      data: updatedDoc 
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating order status' });
  }
} 