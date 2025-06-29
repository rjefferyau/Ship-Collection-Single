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
    
    // Check if the starship is on order
    if (!starship.onOrder) {
      return res.status(400).json({ success: false, message: 'Starship is not on order' });
    }
    
    // Update the starship
    starship.onOrder = false;
    starship.owned = true;
    
    // If there's a price paid for the order, use it as the purchase price
    if (starship.pricePaid !== undefined && starship.pricePaid !== null) {
      starship.purchasePrice = starship.pricePaid;
    }
    
    // Save the changes
    await starship.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Starship marked as received and added to collection',
      data: starship 
    });
  } catch (error) {
    console.error('Error marking starship as received:', error);
    return res.status(500).json({ success: false, message: 'Error marking starship as received' });
  }
} 