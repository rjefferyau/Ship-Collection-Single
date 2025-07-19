import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import mongoose from 'mongoose';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ success: false, error: 'Error parsing form' });
      }
      
      const file = files.image;
      const starshipId = fields.starshipId;
      
      if (!file || Array.isArray(file)) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      
      if (!starshipId || Array.isArray(starshipId)) {
        return res.status(400).json({ success: false, error: 'No starship ID provided' });
      }

      // Connect to database
      await dbConnect();
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate a unique filename
      const fileExt = path.extname(file.originalFilename || 'image.jpg');
      const fileName = `${starshipId}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Copy the file to the uploads directory
      fs.copyFileSync(file.filepath, filePath);
      
      // Update the starship with the image URL
      const imageUrl = `/uploads/${fileName}`;
      
      // Find the starship by ID (handle both string and ObjectId formats)
      let starship = null;
      
      // Use collection.findOne to handle the Docker string ID environment
      const foundDoc = await Starship.collection.findOne({ _id: starshipId as any });
      if (foundDoc) {
        starship = foundDoc;
      } else {
        // Fallback: try ObjectId format
        try {
          const objectId = new mongoose.Types.ObjectId(starshipId);
          const foundDocObjectId = await Starship.collection.findOne({ _id: objectId });
          if (foundDocObjectId) {
            starship = foundDocObjectId;
          }
        } catch (e) {
          // If ObjectId conversion fails, starship remains null
        }
      }
      
      if (!starship) {
        return res.status(404).json({ 
          success: false, 
          error: 'Starship not found' 
        });
      }
      
      // Use direct MongoDB collection update to avoid Mongoose model/collection name conflicts
      const directUpdate = await Starship.collection.findOneAndUpdate(
        { _id: starship._id.toString() } as any,
        { $set: { imageUrl: imageUrl } },
        { returnDocument: 'after' }
      );
      
      if (!directUpdate.value) {
        throw new Error('Failed to update starship imageUrl');
      }
      
      return res.status(200).json({ 
        success: true, 
        data: { 
          _id: starship._id, 
          shipName: starship.shipName, 
          imageUrl: imageUrl 
        } 
      });
      
    } catch (error) {
      console.error('Error handling image upload:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error handling image upload',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
} 