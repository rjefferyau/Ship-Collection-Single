import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface EditionData {
  name: string;
  description?: string;
  retailPrice?: number;
  franchise: string;
  isDefault?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to MongoDB');
    
    // Parse the form data
    const form = new IncomingForm();
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Get the uploaded file
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Get metadata from form fields
    const franchise = fields.franchise?.[0];
    const isDefault = fields.isDefault?.[0] === 'true';

    if (!franchise) {
      return res.status(400).json({ success: false, error: 'Franchise is required' });
    }

    // Read the file content
    const fileContent = fs.readFileSync(file.filepath, 'utf8');
    
    // Parse the CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Validate and process the records
    const editions: EditionData[] = [];
    let errors = 0;

    for (const record of records) {
      // Validate required fields
      if (!record.name) {
        errors++;
        continue;
      }

      // Create edition object
      const edition: EditionData = {
        name: record.name.trim(),
        franchise: franchise,
        isDefault: isDefault
      };

      // Add optional fields if they exist
      if (record.description) {
        edition.description = record.description.trim();
      }

      if (record.retailPrice) {
        const price = parseFloat(record.retailPrice);
        if (!isNaN(price) && price >= 0) {
          edition.retailPrice = price;
        }
      }

      editions.push(edition);
    }

    // Save editions to the database
    const db = mongoose.connection.db;
    const editionsCollection = db.collection('editions');
    let imported = 0;

    for (const edition of editions) {
      // Generate internal name
      const nameSlug = edition.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const franchiseSlug = edition.franchise.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const internalName = `${nameSlug}-${franchiseSlug}`;

      // Check if edition with the same name and franchise already exists
      const existingEdition = await editionsCollection.findOne({ 
        name: edition.name,
        franchise: edition.franchise
      });

      if (!existingEdition) {
        // Add new edition
        await editionsCollection.insertOne({
          ...edition,
          internalName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        imported++;
      } else {
        // Update existing edition
        await editionsCollection.updateOne(
          { _id: existingEdition._id },
          { 
            $set: {
              ...edition,
              internalName,
              updatedAt: new Date(),
            }
          }
        );
        imported++;
      }
    }

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      imported,
      errors,
      total: editions.length + errors,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return res.status(500).json({ success: false, error: 'Failed to process CSV file' });
  }
} 