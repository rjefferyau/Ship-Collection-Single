import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';
import Starship from '../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const edition = await Edition.findById(id);
        if (!edition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        res.status(200).json({ success: true, data: edition });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'PUT':
      try {
        // Check if retail price is being updated
        const oldEdition = await Edition.findById(id);
        if (!oldEdition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }

        // Update the edition
        const updatedEdition = await Edition.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });

        // If retail price was updated and the updateStarships flag is true, update all starships
        const updateStarships = req.query.updateStarships === 'true';
        const retailPriceChanged = 
          req.body.retailPrice !== undefined && 
          oldEdition.retailPrice !== req.body.retailPrice;

        if (updateStarships && retailPriceChanged && updatedEdition) {
          // Update all starships in this edition with the new retail price
          // Only update starships that don't already have a custom retail price set
          await Starship.updateMany(
            { 
              edition: updatedEdition.name,
              $or: [
                { retailPrice: { $exists: false } },
                { retailPrice: null }
              ]
            },
            { retailPrice: parseFloat(req.body.retailPrice) }
          );
        }

        res.status(200).json({ success: true, data: updatedEdition });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'DELETE':
      try {
        const deletedEdition = await Edition.findByIdAndDelete(id);
        if (!deletedEdition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
} 