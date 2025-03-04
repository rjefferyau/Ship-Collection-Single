import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
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
        const starship = await Starship.findById(id);
        if (!starship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
        }
        res.status(200).json({ success: true, data: starship });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'PUT':
      try {
        // Extract currentEdition from request body if present
        const { currentEdition, ...updateData } = req.body;
        
        const starship = await Starship.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });
        
        if (!starship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
        }
        
        // Return the currentEdition in the response for the client to use
        res.status(200).json({ 
          success: true, 
          data: starship,
          currentEdition: currentEdition || null
        });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'PATCH':
      try {
        const allowedFields = [
          'issue',
          'edition',
          'shipName',
          'faction',
          'releaseDate',
          'retailPrice',
          'purchasePrice',
          'purchaseDate',
          'owned',
          'wishlist',
          'wishlistPriority',
          'imageUrl',
          'magazinePdfUrl',
          'condition',
          'conditionNotes',
          'conditionPhotos',
          'lastInspectionDate'
        ];
        
        // Filter out any fields that aren't in the allowed list
        const updateData = Object.keys(req.body)
          .filter(key => allowedFields.includes(key))
          .reduce<Record<string, any>>((obj, key) => {
            obj[key] = req.body[key];
            return obj;
          }, {});
        
        const starship = await Starship.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });
        
        if (!starship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
        }
        
        res.status(200).json({ success: true, data: starship });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'DELETE':
      try {
        const deletedStarship = await Starship.findByIdAndDelete(id);
        if (!deletedStarship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
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