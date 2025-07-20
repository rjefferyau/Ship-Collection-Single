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
        const { collectionType, franchise, edition, noImage, page, limit, search } = req.query;
        // Build filter object based on query parameters
        const filter: any = {};
        const andConditions: any[] = [];
        
        if (collectionType && collectionType !== '') {
          // Handle the case where collectionType might be undefined in the database
          andConditions.push({
            $or: [
              { collectionType: collectionType },
              { collectionType: { $exists: false } }
            ]
          });
        }
        
        if (franchise && franchise !== '') {
          // Use case-insensitive regex for franchise matching using string pattern
          filter.franchise = { $regex: `^${franchise}$`, $options: 'i' };
        }
        
        if (edition && edition !== '') {
          // Match by internal name or display name
          andConditions.push({
            $or: [
              { editionInternalName: edition },
              { edition: edition }
            ]
          });
        }
        
        // Handle search filter
        if (search && search !== '') {
          const searchRegex = { $regex: search, $options: 'i' };
          andConditions.push({
            $or: [
              { shipName: searchRegex },
              { faction: searchRegex },
              { issue: searchRegex }
            ]
          });
        }
        
        // Filter for ships without images
        if (noImage === 'true') {
          andConditions.push({
            $or: [
              { imageUrl: { $exists: false } },
              { imageUrl: null },
              { imageUrl: '' }
            ]
          });
        }
        
        // Apply all AND conditions
        if (andConditions.length > 0) {
          filter.$and = andConditions;
        }
        
        // Parse pagination parameters
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 50; // Default to 50 items per page
        const skip = (pageNum - 1) * limitNum;
        
        // Get total count for pagination info
        const totalCount = await Starship.countDocuments(filter);
        
        // Use aggregation pipeline for proper alphanumeric sorting of issue numbers
        const starships = await Starship.aggregate([
          { $match: filter },
          {
            $addFields: {
              // Extract prefix and numeric parts for proper sorting
              issuePrefix: {
                $regexFind: { input: "$issue", regex: /^([A-Za-z]*)/ }
              },
              issueNumericPart: {
                $regexFind: { input: "$issue", regex: /(\d+)/ }
              }
            }
          },
          {
            $addFields: {
              // Clean prefix (empty string if no match)
              sortPrefix: {
                $ifNull: [{ $arrayElemAt: ["$issuePrefix.captures", 0] }, ""]
              },
              // Convert numeric part to integer (0 if no match)
              sortNumeric: {
                $convert: {
                  input: { $ifNull: [{ $arrayElemAt: ["$issueNumericPart.captures", 0] }, "0"] },
                  to: "int",
                  onError: 0
                }
              }
            }
          },
          { $sort: { sortPrefix: 1, sortNumeric: 1, shipName: 1 } },
          { $skip: skip },
          { $limit: limitNum },
          { $project: { issuePrefix: 0, issueNumericPart: 0, sortPrefix: 0, sortNumeric: 0 } } // Remove temporary fields
        ]);
        
        console.log(`Found ${starships.length} starships on page ${pageNum} of ${Math.ceil(totalCount / limitNum)} (total: ${totalCount})`);
        
        // Ensure all IDs are strings and transform image URLs for frontend compatibility
        const sanitizedStarships = starships.map(ship => {
          return {
            ...ship,
            _id: ship._id.toString(),
            imageUrl: getImageUrl(ship.imageUrl)
          };
        });
        
        res.status(200).json({ 
          success: true, 
          data: sanitizedStarships,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNum),
            hasNext: pageNum < Math.ceil(totalCount / limitNum),
            hasPrev: pageNum > 1
          }
        });
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