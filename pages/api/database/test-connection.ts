import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Direct collection access
    const collection = mongoose.connection.collection('starshipv5');
    
    // Get first document directly from collection
    const firstDoc = await collection.findOne({}, { sort: { issue: 1, shipName: 1 } });
    
    // Count total documents
    const totalCount = await collection.countDocuments();
    
    // Test if we can find the document by ID
    const testId = firstDoc?._id;
    const foundById = await collection.findOne({ _id: testId });
    
    return res.status(200).json({
      success: true,
      data: {
        databaseName: mongoose.connection.db.databaseName,
        collectionName: collection.collectionName,
        firstDocumentId: firstDoc?._id?.toString(),
        firstDocumentShipName: firstDoc?.shipName,
        totalDocuments: totalCount,
        canFindById: !!foundById,
        sampleFields: Object.keys(firstDoc || {})
      }
    });
    
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error testing connection' 
    });
  }
}