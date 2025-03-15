import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  console.log(`Toggle wishlist API called for ID: ${id}, Method: ${method}`);

  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    if (method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

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
    
    // Toggle the wishlist status
    console.log(`Current wishlist status: ${rawDoc.wishlist}, toggling to: ${!rawDoc.wishlist}`);
    const newWishlistStatus = !rawDoc.wishlist;
    
    // Prepare the update
    const updateData: any = { 
      wishlist: newWishlistStatus,
      updatedAt: new Date()
    };
    
    // If adding to wishlist, set a default priority if not already set
    if (newWishlistStatus && !rawDoc.wishlistPriority) {
      console.log(`Adding to wishlist, setting priority`);
      
      // Get the highest priority number currently in use
      const highestPriorityDoc = await db.collection(collectionName)
        .find({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1)
        .toArray();
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriorityDoc.length > 0 && highestPriorityDoc[0].wishlistPriority 
        ? highestPriorityDoc[0].wishlistPriority + 1 
        : 1;
      
      console.log(`Setting wishlist priority to: ${nextPriority}`);
      updateData.wishlistPriority = nextPriority;
    }
    
    // If removing from wishlist, clear the priority
    if (!newWishlistStatus) {
      console.log(`Removing from wishlist, clearing priority`);
      updateData.wishlistPriority = null;
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
      data: updatedDoc,
      message: newWishlistStatus ? 'Added to wishlist' : 'Removed from wishlist'
    });
  } catch (error: any) {
    console.error('Error toggling wishlist status:', error);
    return res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 