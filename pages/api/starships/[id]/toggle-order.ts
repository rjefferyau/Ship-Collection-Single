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
    
    const { onOrder, pricePaid, orderDate } = req.body;
    
    // Find the starship
    const starship = await Starship.findById(id);
    
    if (!starship) {
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    // Update the order status
    starship.onOrder = onOrder;
    
    // If marking as on order, update the price paid and order date
    if (onOrder) {
      starship.pricePaid = pricePaid;
      starship.orderDate = orderDate ? new Date(orderDate) : new Date();
      
      // If it was on the wishlist, remove it from the wishlist
      if (starship.wishlist) {
        starship.wishlist = false;
        starship.wishlistPriority = undefined;
      }
    } else {
      // If removing from order, clear the price paid and order date
      starship.pricePaid = undefined;
      starship.orderDate = undefined;
      
      // Add it back to the wishlist
      starship.wishlist = true;
      
      // Find the highest priority in the wishlist to add this at the end
      const highestPriority = await Starship.find({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1)
        .select('wishlistPriority');
      
      // Set the priority to one more than the highest, or 1 if there are no wishlist items
      starship.wishlistPriority = highestPriority.length > 0 && highestPriority[0].wishlistPriority 
        ? highestPriority[0].wishlistPriority + 1 
        : 1;
    }
    
    await starship.save();
    
    return res.status(200).json({ 
      success: true, 
      message: onOrder ? 'Starship marked as on order' : 'Starship removed from orders and added to wishlist',
      data: starship 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Error updating order status' });
  }
} 