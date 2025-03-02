import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import Edition from '../../../models/Edition';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get all editions
    const editions = await Edition.find({});
    const editionMap = new Map(editions.map(edition => [edition.name.toLowerCase(), edition.name]));
    
    // Get all starships
    const starships = await Starship.find({});
    
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    
    // Update each starship with the standardized edition name
    for (const starship of starships) {
      try {
        if (!starship.edition) {
          unchanged++;
          continue;
        }
        
        const standardizedEdition = editionMap.get(starship.edition.toLowerCase());
        
        if (!standardizedEdition) {
          unchanged++;
          continue;
        }
        
        if (starship.edition === standardizedEdition) {
          unchanged++;
          continue;
        }
        
        starship.edition = standardizedEdition;
        await starship.save();
        updated++;
      } catch (error) {
        console.error(`Error updating starship ${starship._id}:`, error);
        errors++;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        total: starships.length,
        updated,
        unchanged,
        errors
      }
    });
  } catch (error) {
    console.error('Error updating starships:', error);
    res.status(500).json({ success: false, error: 'Failed to update starships' });
  }
} 