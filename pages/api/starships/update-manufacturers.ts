import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import Manufacturer from '../../../models/Manufacturer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { manufacturerId, franchises = [], collectionTypes = [] } = req.body;

    if (!manufacturerId) {
      return res.status(400).json({ success: false, error: 'Manufacturer ID is required' });
    }

    // Get the manufacturer
    const manufacturer = await Manufacturer.findById(manufacturerId);
    if (!manufacturer) {
      return res.status(404).json({ success: false, error: 'Manufacturer not found' });
    }

    // Build the query based on provided filters
    const query: any = {};
    
    // If franchises are provided, filter by them
    if (franchises.length > 0) {
      query.franchise = { $in: franchises };
    }
    
    // If collection types are provided, filter by them
    if (collectionTypes.length > 0) {
      query.collectionType = { $in: collectionTypes };
    }

    // Update all matching starships
    const updateResult = await Starship.updateMany(
      query,
      { $set: { manufacturer: manufacturer.name } }
    );

    return res.status(200).json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} starships with manufacturer: ${manufacturer.name}`,
      data: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error: any) {
    console.error('Error updating manufacturers:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 