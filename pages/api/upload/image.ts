import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
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
      const starship = await Starship.findByIdAndUpdate(
        starshipId,
        { imageUrl },
        { new: true }
      );
      
      if (!starship) {
        return res.status(404).json({ success: false, error: 'Starship not found' });
      }
      
      res.status(200).json({ success: true, data: starship });
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ success: false, error: 'Error handling upload' });
  }
} 