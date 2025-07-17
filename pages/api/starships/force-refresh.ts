import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Build filter query
    const filter: any = {};
    
    if (req.query.collectionType && req.query.collectionType !== '') {
      filter.collectionType = req.query.collectionType;
    }
    
    if (req.query.franchise && req.query.franchise !== '') {
      filter.franchise = req.query.franchise;
    }
    
    // Get starships with clean data structure
    const starships = await Starship.find(filter).sort({ issue: 1, shipName: 1 });
    
    console.log(`Force refresh: Found ${starships.length} starships with filters:`, filter);
    
    // Ensure all IDs are strings and clean the data
    const cleanedStarships = starships.map(ship => {
      const shipData = ship.toJSON();
      return {
        ...shipData,
        _id: ship._id.toString()
      };
    });
    
    // Add extra headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json({
      success: true,
      data: cleanedStarships,
      meta: {
        total: cleanedStarships.length,
        refreshedAt: new Date().toISOString(),
        sampleIds: cleanedStarships.slice(0, 3).map(s => s._id)
      }
    });
    
  } catch (error: any) {
    console.error('Force refresh error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error during force refresh' 
    });
  }
}