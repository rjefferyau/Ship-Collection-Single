import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Force no caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
    
    // Get fresh data directly from MongoDB
    const collection = mongoose.connection.collection('starshipv5');
    
    // Get all documents with minimal data, sorted consistently
    const docs = await collection.find({}, { 
      projection: { _id: 1, shipName: 1, issue: 1, wishlist: 1, onOrder: 1, owned: 1 }
    }).sort({ issue: 1, shipName: 1 }).toArray();
    
    const currentIds = docs.map(doc => ({
      _id: doc._id.toString(),
      shipName: doc.shipName,
      issue: doc.issue,
      wishlist: doc.wishlist || false,
      onOrder: doc.onOrder || false, 
      owned: doc.owned || false
    }));
    
    return res.status(200).json({
      success: true,
      timestamp: Date.now(),
      meta: {
        total: currentIds.length,
        database: mongoose.connection.db.databaseName,
        collection: collection.collectionName
      },
      data: currentIds
    });
    
  } catch (error: any) {
    console.error('Error getting current IDs:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error getting current IDs' 
    });
  }
}