import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get parameters from request body
    const { 
      franchise = "Star Trek", 
      incorrectEditionInternalName = "regular-battlestar-galactica",
      correctEditionInternalName = "regular-star-trek"
    } = req.body;
    
    // Find starships with the incorrect editionInternalName and matching franchise
    const query = { 
      franchise: franchise,
      editionInternalName: incorrectEditionInternalName
    };
    
    const starships = await Starship.find(query);
    
    if (starships.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No starships found with the specified criteria.',
        count: 0
      });
    }
    
    // Track statistics
    const stats = {
      total: starships.length,
      updated: 0,
      errors: 0,
      affectedShips: [] as Array<{id: string, name: string}>
    };
    
    // Update each starship with the correct editionInternalName
    const updatePromises = starships.map(async (starship) => {
      try {
        starship.editionInternalName = correctEditionInternalName;
        await starship.save();
        
        stats.updated++;
        stats.affectedShips.push({
          id: starship._id.toString(),
          name: starship.shipName
        });
      } catch (error) {
        console.error(`Error updating starship ${starship._id}:`, error);
        stats.errors++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Send success response
    return res.status(200).json({
      success: true,
      message: `Fixed ${stats.updated} of ${stats.total} starships with incorrect editionInternalName.`,
      stats
    });
  } catch (error: any) {
    console.error('Error fixing editionInternalName:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 