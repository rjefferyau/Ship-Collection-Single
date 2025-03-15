import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Connecting to MongoDB to delete old collections...');
    await dbConnect();
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('Available collections:', collectionNames);
    
    let v3Deleted = false;
    let v4Deleted = false;
    let v3Count = 0;
    let v4Count = 0;
    
    // Check if starshipv3 exists and delete it
    if (collectionNames.includes('starshipv3')) {
      // Get document count before deletion
      v3Count = await db.collection('starshipv3').countDocuments();
      console.log(`Found starshipv3 collection with ${v3Count} documents`);
      
      // Drop the collection
      await db.dropCollection('starshipv3');
      v3Deleted = true;
      console.log('Successfully deleted starshipv3 collection');
    } else {
      console.log('starshipv3 collection not found');
    }
    
    // Check if starshipv4 exists and delete it
    if (collectionNames.includes('starshipv4')) {
      // Get document count before deletion
      v4Count = await db.collection('starshipv4').countDocuments();
      console.log(`Found starshipv4 collection with ${v4Count} documents`);
      
      // Drop the collection
      await db.dropCollection('starshipv4');
      v4Deleted = true;
      console.log('Successfully deleted starshipv4 collection');
    } else {
      console.log('starshipv4 collection not found');
    }
    
    return res.status(200).json({
      success: true,
      results: {
        v3Deleted,
        v4Deleted,
        v3Count,
        v4Count
      }
    });
  } catch (error: any) {
    console.error('Error deleting old collections:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while deleting old collections'
    });
  }
} 