import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  console.log(`Toggle owned API called for ID: ${id}, Method: ${method}`);

  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    if (method !== 'PUT') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }

    // Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid MongoDB ObjectId format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ObjectId format' });
    }

    // Find the starship
    console.log(`Looking for starship with ID: ${id}`);
    const starship = await Starship.findById(id);
    
    if (!starship) {
      console.log(`Starship not found with ID: ${id}`);
      return res.status(404).json({ success: false, error: 'Starship not found' });
    }
    
    console.log(`Found starship: ${starship._id}`);
    
    // Toggle the owned status
    console.log(`Current owned status: ${starship.owned}, toggling to: ${!starship.owned}`);
    starship.owned = !starship.owned;
    
    // If marking as owned, clear wishlist and on-order status
    if (starship.owned) {
      starship.wishlist = false;
      starship.wishlistPriority = undefined;
      starship.onOrder = false;
    }
    
    // Save the updated starship
    await starship.save();
    
    console.log(`Starship updated successfully`);
    
    res.status(200).json({ success: true, data: starship });
  } catch (error: any) {
    console.error('Error in toggle-owned API:', error);
    res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 