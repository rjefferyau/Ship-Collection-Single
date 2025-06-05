import { NextApiRequest, NextApiResponse } from 'next';
import { parse as json2csvParse } from 'json2csv';
import { parse as csvParse } from 'csv-parse/sync';
import formidable from 'formidable';
import fs from 'fs';
import dbConnect from '../../lib/mongodb';
import Starship from '../../models/Starship';
import Edition from '../../models/Edition';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Define the structure of our CSV/JSON records
interface StarshipRecord {
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: string;
  owned?: string | boolean;
  wishlist?: string | boolean;
  wishlistPriority?: string | number;
  onOrder?: string | boolean;
  pricePaid?: string | number;
  orderDate?: string;
  retailPrice?: string | number;
  purchasePrice?: string | number;
  marketValue?: string | number;
  condition?: string;
  conditionNotes?: string;
}

// Helper function to validate and parse dates
function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  
  // Try parsing as ISO date (YYYY-MM-DD)
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try parsing as DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try parsing as MM/DD/YYYY
  const usDate = new Date(dateStr);
  if (!isNaN(usDate.getTime())) {
    return usDate;
  }
  
  return undefined;
}

// Helper to get edition details by name
async function getEditionDetails(editionName: string) {
  if (!editionName) return {};
  const edition = await Edition.findOne({ name: editionName });
  if (!edition) return {};
  return {
    editionInternalName: edition.internalName,
    collectionType: edition.collectionType || '',
    franchise: edition.franchise || ''
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const form = new formidable.IncomingForm();
    let imported = 0;
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error parsing form data' });
      }

      const file = files.file as formidable.File;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const fileContent = fs.readFileSync(file.filepath, 'utf-8');
      
      if (file.originalFilename?.endsWith('.json')) {
        // Parse JSON
        const records = JSON.parse(fileContent) as StarshipRecord[];
        
        // Process each record
        for (const record of records) {
          // Convert string values to appropriate types
          const starshipData = {
            issue: record.issue,
            edition: record.edition,
            shipName: record.shipName,
            faction: record.faction,
            releaseDate: parseDate(record.releaseDate),
            owned: record.owned === 'true' || record.owned === true,
            wishlist: record.wishlist === 'true' || record.wishlist === true,
            wishlistPriority: record.wishlistPriority ? Number(record.wishlistPriority) : undefined,
            onOrder: record.onOrder === 'true' || record.onOrder === true,
            pricePaid: record.pricePaid ? Number(record.pricePaid) : undefined,
            orderDate: parseDate(record.orderDate),
            retailPrice: record.retailPrice ? Number(record.retailPrice) : undefined,
            purchasePrice: record.purchasePrice ? Number(record.purchasePrice) : undefined,
            marketValue: record.marketValue ? Number(record.marketValue) : undefined,
            condition: record.condition,
            conditionNotes: record.conditionNotes
          };
          
          const editionDetails = await getEditionDetails(starshipData.edition);
          const fullStarshipData = {
            ...(starshipData as any),
            editionInternalName: (starshipData as any).editionInternalName || editionDetails.editionInternalName || starshipData.edition,
            collectionType: (starshipData as any).collectionType || editionDetails.collectionType || '',
            franchise: (starshipData as any).franchise || editionDetails.franchise || '',
            owned: typeof starshipData.owned === 'boolean' ? starshipData.owned : false,
            wishlist: typeof starshipData.wishlist === 'boolean' ? starshipData.wishlist : false,
            onOrder: typeof starshipData.onOrder === 'boolean' ? starshipData.onOrder : false,
            wishlistPriority: typeof starshipData.wishlistPriority === 'number' ? starshipData.wishlistPriority : 0,
            conditionPhotos: Array.isArray((starshipData as any).conditionPhotos) ? (starshipData as any).conditionPhotos : [],
            sightings: Array.isArray((starshipData as any).sightings) ? (starshipData as any).sightings : [],
          };
          
          // Try to find existing starship by issue and edition
          const existingStarship = await Starship.findOne({ 
            issue: fullStarshipData.issue, 
            edition: fullStarshipData.edition 
          });
          
          if (existingStarship) {
            // Update existing starship
            await Starship.updateOne(
              { _id: existingStarship._id },
              { $set: fullStarshipData }
            );
          } else {
            // Create new starship
            await Starship.create(fullStarshipData);
          }
          
          imported++;
        }
      } else if (file.originalFilename?.endsWith('.csv')) {
        // Parse CSV
        const records = csvParse(fileContent, {
          columns: true,
          skip_empty_lines: true
        }) as StarshipRecord[];
        
        // Process each row
        for (const record of records) {
          // Convert string values to appropriate types
          const starshipData = {
            issue: record.issue,
            edition: record.edition,
            shipName: record.shipName,
            faction: record.faction,
            releaseDate: parseDate(record.releaseDate),
            owned: record.owned === 'true' || record.owned === true,
            wishlist: record.wishlist === 'true' || record.wishlist === true,
            wishlistPriority: record.wishlistPriority ? Number(record.wishlistPriority) : undefined,
            onOrder: record.onOrder === 'true' || record.onOrder === true,
            pricePaid: record.pricePaid ? Number(record.pricePaid) : undefined,
            orderDate: parseDate(record.orderDate),
            retailPrice: record.retailPrice ? Number(record.retailPrice) : undefined,
            purchasePrice: record.purchasePrice ? Number(record.purchasePrice) : undefined,
            marketValue: record.marketValue ? Number(record.marketValue) : undefined,
            condition: record.condition,
            conditionNotes: record.conditionNotes
          };
          
          const editionDetails = await getEditionDetails(starshipData.edition);
          const fullStarshipData = {
            ...(starshipData as any),
            editionInternalName: (starshipData as any).editionInternalName || editionDetails.editionInternalName || starshipData.edition,
            collectionType: (starshipData as any).collectionType || editionDetails.collectionType || '',
            franchise: (starshipData as any).franchise || editionDetails.franchise || '',
            owned: typeof starshipData.owned === 'boolean' ? starshipData.owned : false,
            wishlist: typeof starshipData.wishlist === 'boolean' ? starshipData.wishlist : false,
            onOrder: typeof starshipData.onOrder === 'boolean' ? starshipData.onOrder : false,
            wishlistPriority: typeof starshipData.wishlistPriority === 'number' ? starshipData.wishlistPriority : 0,
            conditionPhotos: Array.isArray((starshipData as any).conditionPhotos) ? (starshipData as any).conditionPhotos : [],
            sightings: Array.isArray((starshipData as any).sightings) ? (starshipData as any).sightings : [],
          };
          
          // Try to find existing starship by issue and edition
          const existingStarship = await Starship.findOne({ 
            issue: fullStarshipData.issue, 
            edition: fullStarshipData.edition 
          });
          
          if (existingStarship) {
            // Update existing starship
            await Starship.updateOne(
              { _id: existingStarship._id },
              { $set: fullStarshipData }
            );
          } else {
            // Create new starship
            await Starship.create(fullStarshipData);
          }
          
          imported++;
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Successfully imported ${imported} items` 
      });
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
} 