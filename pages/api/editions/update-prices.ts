import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';
import Starship from '../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'POST':
      try {
        const { editionName, retailPrice } = req.body;

        if (!editionName) {
          return res.status(400).json({ success: false, error: 'Edition name is required' });
        }

        if (retailPrice === undefined || retailPrice === null) {
          return res.status(400).json({ success: false, error: 'Retail price is required' });
        }

        // Find the edition to verify it exists
        const edition = await Edition.findOne({ name: editionName });
        
        if (!edition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }

        // Update all starships in this edition with the new retail price
        // Only update starships that don't already have a custom retail price set
        const updateResult = await Starship.updateMany(
          { 
            edition: editionName,
            $or: [
              { retailPrice: { $exists: false } },
              { retailPrice: null }
            ]
          },
          { retailPrice: parseFloat(retailPrice) }
        );

        res.status(200).json({ 
          success: true, 
          message: `Updated retail price for ${updateResult.modifiedCount} starships in ${editionName} edition`,
          modifiedCount: updateResult.modifiedCount
        });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.status(405).json({ success: false, error: 'Method not allowed' });
      break;
  }
} 