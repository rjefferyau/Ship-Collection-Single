import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

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
    
    // Find the starship
    const starship = await Starship.findById(id);
    
    if (!starship) {
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    // Update the priority
    starship.wishlistPriority = priority;
    await starship.save();
    
    return res.status(200).json({ 
      success: true, 
      data: starship,
      message: 'Wishlist priority updated'
    });
  } catch (error) {
    console.error('Error updating wishlist priority:', error);
    return res.status(400).json({ success: false, error });
  }
} 