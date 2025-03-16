import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  if (method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get all starships
    const starships = await Starship.find({}).lean();
    
    // Count items by collection type
    const collectionTypeCounts: Record<string, number> = {};
    
    // Count items by franchise
    const franchiseCounts: Record<string, number> = {};
    
    // Iterate through starships to count by collection type and franchise
    starships.forEach((ship: any) => {
      // Count by collection type
      if (ship.collectionType) {
        collectionTypeCounts[ship.collectionType] = (collectionTypeCounts[ship.collectionType] || 0) + 1;
      }
      
      // Count by franchise
      if (ship.franchise) {
        franchiseCounts[ship.franchise] = (franchiseCounts[ship.franchise] || 0) + 1;
      }
    });
    
    res.status(200).json({ 
      success: true, 
      collectionTypeCounts,
      franchiseCounts,
      totalCount: starships.length
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(400).json({ success: false, error });
  }
} 