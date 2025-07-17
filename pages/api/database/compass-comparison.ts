import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Get connection info
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check starshipv5 collection specifically
    const starshipCollection = db.collection('starshipv5');
    
    // Get document with the exact ID from the screenshot
    const screenshotId = "681578437a8c148f467982d2";
    const screenshotDoc = await starshipCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(screenshotId) 
    });
    
    // Get documents that have the shipName from the screenshot
    const screenshotShipName = "USS Enterprise NCC-1701 (2271)";
    const shipNameMatches = await starshipCollection.find({ 
      shipName: screenshotShipName 
    }).toArray();
    
    // Get all USS Enterprise documents
    const enterpriseShips = await starshipCollection.find({ 
      shipName: { $regex: "USS Enterprise", $options: "i" } 
    }).limit(5).toArray();
    
    // Check if any documents have originalId field
    const docsWithOriginalId = await starshipCollection.find({ 
      originalId: { $exists: true } 
    }).limit(5).toArray();
    
    // Get first 3 documents sorted by issue, shipName (same as APIs)
    const firstThreeDocs = await starshipCollection.find({})
      .sort({ issue: 1, shipName: 1 })
      .limit(3)
      .toArray();
    
    return res.status(200).json({
      success: true,
      data: {
        connectionInfo: {
          database: dbName,
          collections: collectionNames,
          connectionString: process.env.MONGODB_URI || 'using default'
        },
        screenshotAnalysis: {
          screenshotId,
          screenshotDocFound: !!screenshotDoc,
          screenshotDoc: screenshotDoc,
          shipNameMatches: shipNameMatches.length,
          shipNameMatchDocs: shipNameMatches.map(doc => ({ 
            _id: doc._id.toString(), 
            shipName: doc.shipName,
            hasOriginalId: !!doc.originalId 
          }))
        },
        enterpriseShips: enterpriseShips.map(doc => ({ 
          _id: doc._id.toString(), 
          shipName: doc.shipName,
          issue: doc.issue,
          hasOriginalId: !!doc.originalId
        })),
        docsWithOriginalId: docsWithOriginalId.length,
        firstThreeDocuments: firstThreeDocs.map(doc => ({ 
          _id: doc._id.toString(), 
          shipName: doc.shipName,
          issue: doc.issue,
          hasOriginalId: !!doc.originalId 
        }))
      }
    });
    
  } catch (error: any) {
    console.error('Error comparing with Compass:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error comparing with Compass' 
    });
  }
}