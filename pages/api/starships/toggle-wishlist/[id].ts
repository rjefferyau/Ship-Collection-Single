import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  await dbConnect();

  if (method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Find the starship
    const starship = await Starship.findById(id);
    
    if (!starship) {
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    // Toggle the wishlist status
    starship.wishlist = !starship.wishlist;
    
    // If adding to wishlist, set a default priority if not already set
    if (starship.wishlist && !starship.wishlistPriority) {
      // Get the highest priority number currently in use
      const highestPriority = await Starship.find({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1)
        .select('wishlistPriority');
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriority.length > 0 && highestPriority[0].wishlistPriority 
        ? highestPriority[0].wishlistPriority + 1 
        : 1;
      
      starship.wishlistPriority = nextPriority;
    }
    
    // If removing from wishlist, clear the priority
    if (!starship.wishlist) {
      starship.wishlistPriority = undefined;
    }
    
    await starship.save();
    
    return res.status(200).json({ 
      success: true, 
      data: starship,
      message: starship.wishlist ? 'Added to wishlist' : 'Removed from wishlist'
    });
  } catch (error) {
    console.error('Error toggling wishlist status:', error);
    return res.status(400).json({ success: false, error });
  }
} 