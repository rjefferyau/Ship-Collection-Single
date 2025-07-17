import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    const collection = mongoose.connection.collection('starshipv5');
    
    // Try multiple approaches to find the document
    const testId = id || "681578437a8c148f467985fe";
    
    console.log(`Testing ID: ${testId}`);
    
    // Method 1: Direct ObjectId
    const method1 = await collection.findOne({ _id: new mongoose.Types.ObjectId(testId) });
    
    // Method 2: String ID (shouldn't work but let's test)
    const method2 = await collection.findOne({ _id: testId });
    
    // Method 3: Using $eq operator
    const method3 = await collection.findOne({ _id: { $eq: new mongoose.Types.ObjectId(testId) } });
    
    // Method 4: Find all documents and search manually
    const allDocs = await collection.find({}, { projection: { _id: 1, shipName: 1 } }).limit(10).toArray();
    const manualFind = allDocs.find(doc => doc._id.toString() === testId);
    
    // Get database/connection info
    const dbInfo = {
      database: mongoose.connection.db.databaseName,
      collection: collection.collectionName,
      totalDocs: await collection.countDocuments(),
      connectionState: mongoose.connection.readyState
    };
    
    return res.status(200).json({
      success: true,
      testId,
      methods: {
        objectId: !!method1,
        stringId: !!method2,
        eqOperator: !!method3,
        manualFind: !!manualFind
      },
      results: {
        method1Document: method1 ? { _id: method1._id.toString(), shipName: method1.shipName } : null,
        method3Document: method3 ? { _id: method3._id.toString(), shipName: method3.shipName } : null,
        manualFindDocument: manualFind ? { _id: manualFind._id.toString(), shipName: manualFind.shipName } : null
      },
      dbInfo,
      sampleDocuments: allDocs.map(doc => ({ _id: doc._id.toString(), shipName: doc.shipName }))
    });
    
  } catch (error: any) {
    console.error('Error testing find by ID:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error testing find by ID' 
    });
  }
}