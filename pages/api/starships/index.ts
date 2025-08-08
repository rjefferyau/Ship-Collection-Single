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
          console.log('Filtering by edition:', edition);
          // Match by internal name or display name
          andConditions.push({
            $or: [
              { editionInternalName: edition },
              { edition: edition }
            ]
          });
          console.log('Edition filter condition:', {
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
        
        // Optional fields selection
        const fieldsParam = (req.query.fields as string) || '';
        const fieldList = fieldsParam
          ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
          : [];
        const projectFields: any = {};
        if (fieldList.length > 0) {
          for (const f of fieldList) projectFields[f] = 1;
        }

        // Single $facet aggregation for counts, total and page data
        const [result] = await Starship.aggregate([
          { $match: filter },
          {
            $facet: {
              total: [{ $count: 'count' }],
              counts: [
                {
                  $group: {
                    _id: null,
                    ownedCount: { $sum: { $cond: [{ $eq: ["$owned", true] }, 1, 0] } },
                    wishlistCount: { $sum: { $cond: [{ $eq: ["$wishlist", true] }, 1, 0] } },
                    onOrderCount: { $sum: { $cond: [{ $eq: ["$onOrder", true] }, 1, 0] } },
                    notOwnedCount: {
                      $sum: {
                        $cond: [
                          {
                            $and: [
                              { $ne: ["$owned", true] },
                              { $ne: ["$wishlist", true] },
                              { $ne: ["$onOrder", true] }
                            ]
                          },
                          1,
                          0
                        ]
                      }
                    }
                  }
                }
              ],
              last: [
                { $group: { _id: null, latest: { $max: '$updatedAt' } } }
              ],
              pageData: [
                {
                  $addFields: {
                    issuePrefix: { $regexFind: { input: "$issue", regex: /^([A-Za-z]*)/ } },
                    issueNumericPart: { $regexFind: { input: "$issue", regex: /(\d+)/ } }
                  }
                },
                {
                  $addFields: {
                    sortPrefix: { $ifNull: [{ $arrayElemAt: ["$issuePrefix.captures", 0] }, ""] },
                    sortNumeric: { $convert: { input: { $ifNull: [{ $arrayElemAt: ["$issueNumericPart.captures", 0] }, "0"] }, to: 'int', onError: 0 } }
                  }
                },
                { $sort: { sortPrefix: 1, sortNumeric: 1, shipName: 1 } },
                { $skip: skip },
                { $limit: limitNum },
                // Avoid mixing include and exclude in projection
                { $project: fieldList.length > 0 
                    ? projectFields 
                    : { issuePrefix: 0, issueNumericPart: 0, sortPrefix: 0, sortNumeric: 0 } 
                }
              ]
            }
          }
        ]);

        const totalCount = (result?.total?.[0]?.count as number) || 0;
        const counts = (result?.counts?.[0] as any) || { ownedCount: 0, wishlistCount: 0, onOrderCount: 0, notOwnedCount: 0 };
        const pageData = (result?.pageData as any[]) || [];
        const latest = result?.last?.[0]?.latest as Date | undefined;

        // Conditional GET support (bypass when cache-busting param present)
        const bypassCache = typeof req.query._t !== 'undefined';
        if (latest && !bypassCache) {
          const lastModified = new Date(latest).toUTCString();
          const ifModifiedSince = req.headers['if-modified-since'];
          if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
            res.status(304).end();
            return;
          }
          res.setHeader('Last-Modified', lastModified);
          res.setHeader('Cache-Control', 'no-cache');
        }

        // Ensure all IDs are strings and transform image URLs for frontend compatibility
        const sanitizedStarships = pageData.map((ship: any) => ({
          ...ship,
          _id: ship._id.toString(),
          imageUrl: getImageUrl(ship.imageUrl)
        }));
        
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
          },
          statusCounts: {
            owned: counts.ownedCount,
            wishlist: counts.wishlistCount,
            onOrder: counts.onOrderCount,
            notOwned: counts.notOwnedCount
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