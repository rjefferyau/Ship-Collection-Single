import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import Edition from '../../../models/Edition';

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
        
        // If edition is being updated but editionInternalName is not provided, try to find the internal name
        if (updateData.edition && !updateData.editionInternalName) {
          const edition = await Edition.findOne({ name: updateData.edition });
          if (edition && edition.internalName) {
            updateData.editionInternalName = edition.internalName;
          } else {
            // If no internal name is found, use the edition name as a fallback
            updateData.editionInternalName = updateData.edition;
          }
        }
        
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
          'editionInternalName',
          'shipName',
          'faction',
          'manufacturer',
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
          'lastInspectionDate',
          'franchise',
          'collectionType',
          'onOrder',
          'pricePaid',
          'orderDate',
          'marketValue'
        ];
        
        // Filter out any fields that aren't in the allowed list
        const updateData = Object.keys(req.body)
          .filter(key => allowedFields.includes(key))
          .reduce<Record<string, any>>((obj, key) => {
            obj[key] = req.body[key];
            return obj;
          }, {});
        
        // If edition is being updated but editionInternalName is not provided, try to find the internal name
        if (updateData.edition && !updateData.editionInternalName) {
          const edition = await Edition.findOne({ name: updateData.edition });
          if (edition && edition.internalName) {
            updateData.editionInternalName = edition.internalName;
          } else {
            // If no internal name is found, use the edition name as a fallback
            updateData.editionInternalName = updateData.edition;
          }
        }
        
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