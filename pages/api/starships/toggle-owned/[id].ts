import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

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
    await dbConnect();
    console.log('Connected to MongoDB');

    if (method !== 'PUT') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
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
      return res.status(404).json({ success: false, error: 'Starship not found' });
    }
    
    console.log(`Document found in ${collectionName}: ${rawDoc._id}`);
    
    // Toggle the owned status
    console.log(`Current owned status: ${rawDoc.owned}, toggling to: ${!rawDoc.owned}`);
    const newOwnedStatus = !rawDoc.owned;
    
    // Update the document
    const result = await db.collection(collectionName).updateOne(
      { _id: id as any },
      { $set: { 
        owned: newOwnedStatus,
        updatedAt: new Date()
      }}
    );
    
    console.log(`Update result: ${result.modifiedCount} document(s) modified`);
    
    // Get the updated document
    const updatedDoc = await db.collection(collectionName).findOne({ _id: id as any });
    
    res.status(200).json({ success: true, data: updatedDoc });
  } catch (error: any) {
    console.error('Error in toggle-owned API:', error);
    res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 