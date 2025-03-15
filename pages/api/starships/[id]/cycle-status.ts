import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Find the starship
    const starship = await Starship.findById(id);
    
    if (!starship) {
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    // If the starship is owned, we don't change the status
    if (starship.owned) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change status of owned starships' 
      });
    }
    
    let message = '';
    
    // Cycle through states: not on wishlist → on wishlist → on order → not on wishlist
    if (!starship.wishlist && !starship.onOrder) {
      // Not on wishlist → Add to wishlist
      starship.wishlist = true;
      
      // Set a default priority if not already set
      const highestPriority = await Starship.find({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1)
        .select('wishlistPriority');
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriority.length > 0 && highestPriority[0].wishlistPriority 
        ? highestPriority[0].wishlistPriority + 1 
        : 1;
      
      starship.wishlistPriority = nextPriority;
      message = 'Added to wishlist';
    } 
    else if (starship.wishlist && !starship.onOrder) {
      // On wishlist → Mark as on order
      starship.wishlist = false;
      starship.wishlistPriority = undefined;
      starship.onOrder = true;
      starship.orderDate = new Date();
      
      // Use retail price as default price paid if available
      if (starship.retailPrice) {
        starship.pricePaid = starship.retailPrice;
      }
      
      message = 'Marked as on order';
    }
    else if (starship.onOrder) {
      // On order → Remove from order and wishlist
      starship.onOrder = false;
      starship.pricePaid = undefined;
      starship.orderDate = undefined;
      starship.wishlist = false;
      starship.wishlistPriority = undefined;
      
      message = 'Removed from orders and wishlist';
    }
    
    await starship.save();
    
    return res.status(200).json({ 
      success: true, 
      message,
      data: starship 
    });
  } catch (error) {
    console.error('Error cycling status:', error);
    return res.status(500).json({ success: false, message: 'Error cycling status' });
  }
} 