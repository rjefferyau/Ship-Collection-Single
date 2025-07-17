import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    const { search, limit = 10, missingId } = req.query;
    
    // Check for a specific missing ID
    if (missingId) {
      const missingIdStr = missingId as string;
      console.log(`Debugging missing ID: ${missingIdStr}`);
      
      // Find the closest matching IDs
      const allIds = await Starship.find({}, { _id: 1 }).sort({ _id: 1 });
      const idStrings = allIds.map(doc => doc._id.toString());
      
      // Find IDs that are similar to the missing one
      const similarIds = idStrings.filter(id => {
        const diff = id.split('').reduce((acc: number, char: string, i: number) => {
          return acc + (char !== missingIdStr[i] ? 1 : 0);
        }, 0);
        return diff <= 3; // Find IDs with 3 or fewer character differences
      });
      
      return res.status(200).json({
        success: true,
        missingId: missingIdStr,
        exists: idStrings.includes(missingIdStr),
        totalIds: idStrings.length,
        similarIds: similarIds.slice(0, 10),
        firstFewIds: idStrings.slice(0, 5),
        lastFewIds: idStrings.slice(-5)
      });
    }
    
    if (search) {
      // Search for starships by name or issue
      const starships = await Starship.find({
        $or: [
          { shipName: { $regex: search, $options: 'i' } },
          { issue: { $regex: search, $options: 'i' } }
        ]
      }).limit(parseInt(limit as string));
      
      return res.status(200).json({
        success: true,
        data: starships.map(ship => ({
          _id: ship._id.toString(),
          issue: ship.issue,
          shipName: ship.shipName,
          edition: ship.edition,
          onOrder: ship.onOrder,
          wishlist: ship.wishlist
        }))
      });
    }
    
    // Get recent starships if no search
    const recent = await Starship.find({})
      .sort({ _id: -1 })
      .limit(parseInt(limit as string));
    
    return res.status(200).json({
      success: true,
      total: await Starship.countDocuments(),
      data: recent.map(ship => ({
        _id: ship._id.toString(),
        issue: ship.issue,
        shipName: ship.shipName,
        edition: ship.edition,
        onOrder: ship.onOrder,
        wishlist: ship.wishlist
      }))
    });
    
  } catch (error: any) {
    console.error('Debug API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching debug data' 
    });
  }
}