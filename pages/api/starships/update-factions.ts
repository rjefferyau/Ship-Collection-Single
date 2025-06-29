import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { starshipIds, factionId } = req.body;
    
    if (!Array.isArray(starshipIds) || starshipIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No starships specified' });
    }
    
    // Update all specified starships
    const updateResult = await Starship.updateMany(
      { _id: { $in: starshipIds } },
      { $set: { faction: factionId } }
    );
    
    return res.status(200).json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} starships`,
      data: updateResult
    });
  } catch (error) {
    console.error('Error updating factions:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
} 