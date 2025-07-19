import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

interface PriorityUpdate {
  id: string;
  priority: number;
}

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
    const { items } = req.body as { items: PriorityUpdate[] };
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing or invalid items array' 
      });
    }
    
    // Process all updates in a single batch operation
    const mongoose = require('mongoose');
    const updateOperations = items.map(item => {
      try {
        return {
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(item.id) },
            update: { $set: { wishlistPriority: item.priority } }
          }
        };
      } catch (error) {
        throw new Error(`Invalid ID format: ${item.id}`);
      }
    });
    
    const result = await Starship.bulkWrite(updateOperations);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Wishlist priorities updated',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating wishlist priorities:', error);
    return res.status(400).json({ success: false, error });
  }
} 