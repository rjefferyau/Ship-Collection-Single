import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    const { id, priority } = req.body;
    
    if (!id || priority === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: id and priority' 
      });
    }
    
    // Direct collection access to bypass model issues
    const collection = mongoose.connection.collection('starshipv5');
    
    // Find the document
    const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Starship not found via direct query' });
    }
    
    // Update the priority directly
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { wishlistPriority: priority, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: 'Update failed' });
    }
    
    // Get the updated document
    const updatedDoc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Priority updated via direct query',
      data: {
        _id: updatedDoc._id.toString(),
        shipName: updatedDoc.shipName,
        wishlistPriority: updatedDoc.wishlistPriority
      }
    });
  } catch (error: any) {
    console.error('Error updating priority directly:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
}