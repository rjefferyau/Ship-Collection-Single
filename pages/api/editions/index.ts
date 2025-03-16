import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition, { IEdition } from '../../../models/Edition';

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, any>;
  keyValue?: Record<string, any>;
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
        // Check if we're requesting only the default edition
        const { default: isDefault, franchise } = req.query;
        
        let query: any = {};
        
        // Add default filter if requested
        if (isDefault === 'true') {
          query.isDefault = true;
        }
        
        // Add franchise filter if provided
        if (franchise && typeof franchise === 'string') {
          query.franchise = franchise;
        }
        
        const editions = await Edition.find(query).sort({ name: 1 });
        res.status(200).json({ success: true, data: editions });
      } catch (error) {
        console.error('Error fetching editions:', error);
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        });
      }
      break;
    case 'POST':
      try {
        // Check if an edition with this name and franchise already exists
        const existingEdition = await Edition.findOne({
          name: req.body.name,
          franchise: req.body.franchise
        });
        
        if (existingEdition) {
          return res.status(400).json({ 
            success: false, 
            error: `An edition named "${req.body.name}" already exists for the "${req.body.franchise}" franchise` 
          });
        }
        
        // Check if an edition with this internal name already exists
        if (req.body.internalName) {
          const existingInternalName = await Edition.findOne({
            internalName: req.body.internalName
          });
          
          if (existingInternalName) {
            return res.status(400).json({ 
              success: false, 
              error: `An edition with internal name "${req.body.internalName}" already exists. Please use a different internal name.` 
            });
          }
        }
        
        // Handle isDefault flag - if setting to true, unset any other default editions in the same franchise
        if (req.body.isDefault === true) {
          // Unset isDefault for all other editions in the same franchise
          await Edition.updateMany(
            { 
              franchise: req.body.franchise // Only editions in the same franchise
            },
            { isDefault: false }
          );
        }
        
        const edition = await Edition.create(req.body);
        res.status(201).json({ success: true, data: edition });
      } catch (error: unknown) {
        console.error('Error creating edition:', error);
        // Handle MongoDB duplicate key error
        const mongoError = error as MongoError;
        if (mongoError.code === 11000) {
          // Check if it's a duplicate on the compound index
          if (mongoError.keyPattern && (mongoError.keyPattern.name && mongoError.keyPattern.franchise)) {
            return res.status(400).json({ 
              success: false, 
              error: 'This edition name already exists for this franchise' 
            });
          }
          // Check if it's a duplicate on internalName
          if (mongoError.keyPattern && mongoError.keyPattern.internalName) {
            return res.status(400).json({ 
              success: false, 
              error: 'This internal name is already in use. Please choose a different one.' 
            });
          }
          // Otherwise it's a duplicate on internalName
          return res.status(400).json({ 
            success: false, 
            error: 'An edition with this name and franchise combination already exists' 
          });
        }
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
} 