import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check which collection the Starship model is using
    const modelCollectionName = Starship.collection.name;
    
    // Count documents with originalId in the model's collection
    const countWithOriginalId = await Starship.countDocuments({ originalId: { $exists: true } });
    
    // Get a sample document to see its structure
    const sampleDoc = await Starship.findOne({}).limit(1);
    
    // Check if there are any documents with originalId in other similar collections
    const starshipCollections = collectionNames.filter(name => name.includes('starship'));
    const collectionCounts = {};
    
    for (const collName of starshipCollections) {
      try {
        const collection = mongoose.connection.collection(collName);
        const count = await collection.countDocuments({ originalId: { $exists: true } });
        const total = await collection.countDocuments();
        collectionCounts[collName] = { withOriginalId: count, total };
      } catch (err) {
        collectionCounts[collName] = { error: err.message };
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        allCollections: collectionNames,
        modelCollection: modelCollectionName,
        starshipCollections,
        modelDocumentsWithOriginalId: countWithOriginalId,
        sampleDocId: sampleDoc?._id?.toString(),
        sampleHasOriginalId: !!sampleDoc?.originalId,
        collectionCounts
      }
    });
    
  } catch (error: any) {
    console.error('Error debugging collections:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error debugging collections' 
    });
  }
}