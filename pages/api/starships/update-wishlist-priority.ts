import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  if (method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id, priority } = req.body;
    
    if (!id || priority === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: id and priority' 
      });
    }
    
    // Use direct collection access to bypass any model issues
    const collection = mongoose.connection.collection('starshipv5');
    
    // Debug info
    const dbName = mongoose.connection.db.databaseName;
    const totalDocs = await collection.countDocuments();
    
    // Try multiple ways to find the document
    const docById = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    const docByString = await collection.findOne({ _id: id });
    const anyDoc = await collection.findOne({});
    
    console.log(`Debug - DB: ${dbName}, Collection: ${collection.collectionName}, Total: ${totalDocs}`);
    console.log(`Looking for ID: ${id}, Type: ${typeof id}`);
    console.log(`Found by ObjectId: ${!!docById}, Found by string: ${!!docByString}`);
    console.log(`Sample doc ID: ${anyDoc?._id?.toString()}`);
    
    if (!docByString) {
      return res.status(404).json({ 
        success: false, 
        message: 'Starship not found',
        debug: {
          database: dbName,
          collection: collection.collectionName,
          totalDocuments: totalDocs,
          searchedId: id,
          idType: typeof id,
          sampleId: anyDoc?._id?.toString()
        }
      });
    }
    
    // Update the priority directly
    const result = await collection.updateOne(
      { _id: id },
      { $set: { wishlistPriority: priority, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: 'Update failed' });
    }
    
    // Get the updated document
    const updatedDoc = await collection.findOne({ _id: id });
    
    return res.status(200).json({ 
      success: true, 
      data: {
        _id: updatedDoc._id.toString(),
        shipName: updatedDoc.shipName,
        wishlistPriority: updatedDoc.wishlistPriority
      },
      message: 'Wishlist priority updated'
    });
  } catch (error) {
    console.error('Error updating wishlist priority:', error);
    return res.status(400).json({ success: false, error });
  }
} 