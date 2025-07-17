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
    
    const { id } = req.query;
    
    if (id) {
      // Look for a specific document by ID
      const doc = await Starship.findById(id);
      if (doc) {
        return res.status(200).json({
          success: true,
          data: {
            document: doc.toJSON(),
            rawDocument: doc.toObject(),
            hasOriginalId: !!doc.originalId
          }
        });
      } else {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
    }
    
    // Get the exact document from the screenshot
    const targetId = "681578437a8c148f467982d2";
    const doc = await Starship.findById(targetId);
    
    if (!doc) {
      // Try to find any document and examine its structure
      const anyDoc = await Starship.findOne({});
      const collection = mongoose.connection.collection('starshipv5');
      const rawDoc = await collection.findOne({ _id: new mongoose.Types.ObjectId(targetId) });
      
      return res.status(200).json({
        success: true,
        data: {
          targetIdFound: false,
          targetId,
          anyDocumentId: anyDoc?._id?.toString(),
          anyDocumentRaw: anyDoc?.toObject(),
          rawDirectQuery: rawDoc
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        targetIdFound: true,
        document: doc.toJSON(),
        rawDocument: doc.toObject(),
        hasOriginalId: !!doc.originalId
      }
    });
    
  } catch (error: any) {
    console.error('Error examining document:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error examining document' 
    });
  }
}