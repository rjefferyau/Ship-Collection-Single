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

  const form = new IncomingForm({
    keepExtensions: true,
    multiples: false,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  });
  
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
      
      // Basic MIME/type whitelist (png,jpg,jpeg,webp)
      const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
      const fileExt = path.extname(file.originalFilename || 'image.jpg').toLowerCase();
      if (!allowedExts.has(fileExt)) {
        return res.status(400).json({ success: false, error: 'Invalid file type. Allowed: png, jpg, jpeg, webp' });
      }

      // Reject suspicious filenames
      if ((file.originalFilename || '').includes('..')) {
        return res.status(400).json({ success: false, error: 'Invalid filename' });
      }

      // Enforce size limit (also configured in form parser)
      try {
        const stat = fs.statSync(file.filepath);
        if (stat.size > 10 * 1024 * 1024) {
          return res.status(400).json({ success: false, error: 'File too large (max 10MB)' });
        }
      } catch {}

      // Generate a unique filename
      const fileName = `${starshipId}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Copy the file to the uploads directory
      fs.copyFileSync(file.filepath, filePath);
      
      // Update the starship with the image URL
      const imageUrl = `/uploads/${fileName}`;
      
      // Find and update the starship by ObjectId
      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(starshipId);
      } catch (error: any) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid starship ID format' 
        });
      }
      
      const starship = await Starship.findByIdAndUpdate(
        objectId,
        { $set: { imageUrl: imageUrl } },
        { new: true }
      );
      
      if (!starship) {
        return res.status(404).json({ 
          success: false, 
          error: 'Starship not found' 
        });
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