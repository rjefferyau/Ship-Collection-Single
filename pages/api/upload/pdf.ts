import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

// Disable the default body parser to handle form data
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

  // Create uploads/magazines directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'magazines');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (err) {
      console.error('Error creating uploads directory:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create uploads directory',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // Parse the form data
  const form = new IncomingForm({
    keepExtensions: true,
    multiples: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Error parsing form',
        details: err.message
      });
    }
    
    try {
      const file = files.pdf;
      const starshipId = fields.starshipId;
      
      if (!file || Array.isArray(file)) {
        return res.status(400).json({ success: false, error: 'No file uploaded or multiple files received' });
      }
      
      if (!starshipId || Array.isArray(starshipId)) {
        return res.status(400).json({ success: false, error: 'No starship ID provided or multiple IDs received' });
      }
      
      // Check if the file is a PDF
      const fileExt = path.extname(file.originalFilename || 'document.pdf').toLowerCase();
      if (fileExt !== '.pdf') {
        return res.status(400).json({ success: false, error: 'Only PDF files are allowed' });
      }
      
      // Generate a unique filename
      const fileName = `${starshipId}-magazine-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Copy the file to the uploads directory
      try {
        fs.copyFileSync(file.filepath, filePath);
        
        // Verify the file was copied successfully
        if (!fs.existsSync(filePath)) {
          throw new Error('File was not copied successfully');
        }
        
        const fileStats = fs.statSync(filePath);
        if (fileStats.size === 0) {
          throw new Error('Copied file is empty');
        }
        
        console.log(`PDF saved successfully: ${filePath}, size: ${fileStats.size} bytes`);
      } catch (copyError) {
        console.error('Error copying file:', copyError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save PDF file',
          details: copyError instanceof Error ? copyError.message : String(copyError)
        });
      }
      
      // Update the starship with the PDF URL
      const magazinePdfUrl = `/uploads/magazines/${fileName}`;
      
      try {
        const starship = await Starship.findByIdAndUpdate(
          starshipId,
          { magazinePdfUrl },
          { new: true }
        );
        
        if (!starship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
        }
        
        return res.status(200).json({ 
          success: true, 
          data: starship,
          message: 'PDF uploaded successfully'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update starship record',
          details: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }
    } catch (error) {
      console.error('Unexpected error in PDF upload:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
} 