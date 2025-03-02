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

    // Get unique editions from starships collection
    const uniqueEditions = await Starship.distinct('edition');
    
    // Filter out empty or null values
    const validEditions = uniqueEditions.filter(edition => edition && edition.trim() !== '');
    
    // Check which editions already exist
    const existingEditions = await Edition.find({ name: { $in: validEditions } });
    const existingEditionNames = existingEditions.map(edition => edition.name);
    
    // Filter out editions that already exist
    const newEditions = validEditions.filter(edition => !existingEditionNames.includes(edition));
    
    // Create new editions
    const createdEditions = [];
    for (const editionName of newEditions) {
      const newEdition = await Edition.create({ name: editionName });
      createdEditions.push(newEdition);
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalUnique: validEditions.length,
        existing: existingEditionNames.length,
        imported: createdEditions.length,
        editions: createdEditions
      }
    });
  } catch (error) {
    console.error('Error importing editions:', error);
    res.status(500).json({ success: false, error: 'Failed to import editions' });
  }
} 