import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship, { IStarship } from '../../../models/Starship';
import Edition from '../../../models/Edition';
import { getImageUrl } from '../../../lib/imageHelper';

export interface Starship {
  _id: string;
  issue: string;
  edition: string;
  editionInternalName?: string;
  shipName: string;
  faction: string;
  releaseDate: string;
  retailPrice: number;
  purchasePrice: number;
  purchaseDate: string;
  owned: boolean;
  wishlist: boolean;
  wishlistPriority: number;
  imageUrl: string;
  magazinePdfUrl?: string;
  condition?: string;
  conditionNotes?: string;
  conditionPhotos?: string[];
  lastInspectionDate?: string;
  marketValue?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        // Extract query parameters
        const { collectionType, franchise, edition, noImage } = req.query;
        
        // Build filter object based on query parameters
        const filter: any = {};
        const orConditions: any[] = [];
        
        if (collectionType && collectionType !== '') {
          // Handle the case where collectionType might be undefined in the database
          // Use $or to match either the specified collectionType or undefined collectionType
          orConditions.push(
            { collectionType: collectionType },
            { collectionType: { $exists: false } }
          );
        }
        
        if (franchise && franchise !== '') {
          // Use case-insensitive regex for franchise matching using string pattern
          filter.franchise = { $regex: `^${franchise}$`, $options: 'i' };
        }
        
        if (edition && edition !== '') {
          filter.edition = edition;
        }
        
        // Filter for ships without images
        if (noImage === 'true') {
          filter.$or = [
            { imageUrl: { $exists: false } },
            { imageUrl: null },
            { imageUrl: '' }
          ];
        }
        
        // If we have collection type conditions and need to combine with other $or conditions
        if (orConditions.length > 0 && noImage !== 'true') {
          filter.$or = orConditions;
        } else if (orConditions.length > 0 && noImage === 'true') {
          // If we have both collection type and no image filters, combine them with $and
          filter.$and = [
            { $or: orConditions },
            { $or: [
              { imageUrl: { $exists: false } },
              { imageUrl: null },
              { imageUrl: '' }
            ]}
          ];
          delete filter.$or; // Remove the $or we set for noImage
        }
        
        console.log('Fetching starships with filter:', JSON.stringify(filter, null, 2));
        
        // Query with the filter and consistent sorting
        const starships = await Starship.find(filter).sort({ issue: 1, shipName: 1 });
        console.log(`Found ${starships.length} starships matching filter`);
        
        // Ensure all IDs are strings and transform image URLs for frontend compatibility
        const sanitizedStarships = starships.map(ship => {
          const shipData = ship.toJSON();
          return {
            ...shipData,
            _id: ship._id.toString(),
            imageUrl: getImageUrl(shipData.imageUrl)
          };
        });
        
        res.status(200).json({ success: true, data: sanitizedStarships });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'POST':
      try {
        // If edition is provided but editionInternalName is not, try to find the internal name
        if (req.body.edition && !req.body.editionInternalName) {
          const edition = await Edition.findOne({ name: req.body.edition });
          if (edition && edition.internalName) {
            req.body.editionInternalName = edition.internalName;
          } else {
            // If no internal name is found, use the edition name as a fallback
            req.body.editionInternalName = req.body.edition;
          }
        }
        
        // Use the editionDisplayName as the edition field if provided
        if (req.body.editionDisplayName) {
          req.body.edition = req.body.editionDisplayName;
        }
        
        const starship = await Starship.create(req.body);
        const shipData = starship.toJSON();
        const sanitizedStarship = {
          ...shipData,
          _id: starship._id.toString(),
          imageUrl: getImageUrl(shipData.imageUrl)
        };
        res.status(201).json({ success: true, data: sanitizedStarship });
      } catch (error: any) {
        console.error('Error creating starship:', error);
        
        // Handle MongoDB duplicate key error (code 11000)
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
          if (error.code === 11000) {
            return res.status(400).json({ 
              success: false, 
              message: 'An item with this issue and edition already exists',
              error: error 
            });
          }
        }
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map((err: any) => err.message);
          return res.status(400).json({ 
            success: false, 
            message: 'Validation failed: ' + validationErrors.join(', '),
            error: error
          });
        }
        
        // Default error
        res.status(400).json({ 
          success: false, 
          message: 'Failed to add item: ' + (error.message || 'Unknown error'),
          error: error 
        });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
} 