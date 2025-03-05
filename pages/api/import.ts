import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dbConnect from '../../lib/mongodb';
import Starship, { IStarship } from '../../models/Starship';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Error parsing form data', error: String(err) });
      }

      if (!files.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = file.filepath;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      let data;
      let imported = 0;

      // Determine file type by extension
      if (file.originalFilename?.endsWith('.json')) {
        // Parse JSON
        data = JSON.parse(fileContent);
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          return res.status(400).json({ message: 'Invalid JSON format. Expected an array of starships.' });
        }
        
        // Process each starship
        for (const item of data) {
          // Remove _id to avoid conflicts
          const { _id, ...starshipData } = item;
          
          // Try to find existing starship by issue and edition
          const existingStarship = await Starship.findOne({ 
            issue: item.issue, 
            edition: item.edition 
          });
          
          if (existingStarship) {
            // Update existing starship
            await Starship.updateOne(
              { _id: existingStarship._id },
              { $set: starshipData }
            );
          } else {
            // Create new starship
            await Starship.create(starshipData);
          }
          
          imported++;
        }
      } else if (file.originalFilename?.endsWith('.csv')) {
        // Parse CSV
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        });
        
        // Process each row
        for (const record of records) {
          // Convert string values to appropriate types
          const starshipData = {
            issue: record.issue,
            edition: record.edition,
            shipName: record.shipName,
            faction: record.faction,
            releaseDate: record.releaseDate ? new Date(record.releaseDate) : undefined,
            owned: record.owned === 'true',
            wishlist: record.wishlist === 'true',
            wishlistPriority: record.wishlistPriority ? Number(record.wishlistPriority) : undefined,
            onOrder: record.onOrder === 'true',
            pricePaid: record.pricePaid ? Number(record.pricePaid) : undefined,
            orderDate: record.orderDate ? new Date(record.orderDate) : undefined,
            retailPrice: record.retailPrice ? Number(record.retailPrice) : undefined,
            purchasePrice: record.purchasePrice ? Number(record.purchasePrice) : undefined,
            marketValue: record.marketValue ? Number(record.marketValue) : undefined,
            condition: record.condition,
            conditionNotes: record.conditionNotes
          };
          
          // Try to find existing starship by issue and edition
          const existingStarship = await Starship.findOne({ 
            issue: starshipData.issue, 
            edition: starshipData.edition 
          });
          
          if (existingStarship) {
            // Update existing starship
            await Starship.updateOne(
              { _id: existingStarship._id },
              { $set: starshipData }
            );
          } else {
            // Create new starship
            await Starship.create(starshipData);
          }
          
          imported++;
        }
      } else {
        return res.status(400).json({ message: 'Unsupported file format. Please upload a JSON or CSV file.' });
      }
      
      return res.status(200).json({ message: 'Import successful', imported });
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ message: 'Failed to import data', error: String(error) });
  }
} 