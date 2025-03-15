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
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate a unique filename
      const fileExt = path.extname(file.originalFilename || 'image.jpg');
      const fileName = `${starshipId}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);
      
      try {
        // Copy the file to the uploads directory
        fs.copyFileSync(file.filepath, filePath);
        
        // Update the starship with the image URL
        const imageUrl = `/uploads/${fileName}`;
        
        // Try to find the starship by ID
        let starship = await Starship.findById(starshipId);
        
        // If not found, check if we're using an old ID and try to find by originalId
        if (!starship) {
          console.log(`Starship not found with ID ${starshipId}, checking if it's an old ID...`);
          
          // Check if the ID is a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(starshipId)) {
            return res.status(400).json({ success: false, error: 'Invalid starship ID format' });
          }
          
          // Try to find by originalId
          starship = await Starship.findOne({ originalId: starshipId });
          
          if (!starship) {
            // Check if there's a mapping in the ID mapping collection
            const idMappingCollection = mongoose.connection.collection('starshipIdMapping');
            const mapping = await idMappingCollection.findOne({ oldId: new mongoose.Types.ObjectId(starshipId) });
            
            if (mapping) {
              console.log(`Found ID mapping: ${starshipId} -> ${mapping.newId}`);
              starship = await Starship.findById(mapping.newId);
            }
          }
        }
        
        if (!starship) {
          return res.status(404).json({ 
            success: false, 
            error: 'Starship not found with either current ID or as originalId' 
          });
        }
        
        // Update the starship
        starship.imageUrl = imageUrl;
        await starship.save();
        
        console.log(`Successfully updated image for starship ${starship._id}`);
        return res.status(200).json({ success: true, data: starship });
      } catch (error) {
        console.error('Error handling image upload:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Error handling image upload',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });
  } catch (error) {
    console.error('Error in image upload API:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 