import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
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
        // Update all owned starships that have a retail price but no purchase price
        const updateResult = await Starship.updateMany(
          { 
            owned: true,
            retailPrice: { $exists: true, $ne: null },
            $or: [
              { purchasePrice: { $exists: false } },
              { purchasePrice: null }
            ]
          },
          [
            { $set: { purchasePrice: "$retailPrice" } }
          ]
        );

        res.status(200).json({ 
          success: true, 
          message: `Updated purchase prices for ${updateResult.modifiedCount} owned starships to match their RRP`,
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