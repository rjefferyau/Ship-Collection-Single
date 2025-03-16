import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';
import Starship from '../../../models/Starship';
import { ObjectId } from 'mongodb';

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, any>;
  keyValue?: Record<string, any>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id, updateStarships },
    method,
  } = req;

  await dbConnect();

  // Add detailed logging for debugging
  console.log(`API Request: ${method} /api/editions/${id}`);
  console.log('Query parameters:', req.query);
  
  if (typeof id !== 'string') {
    console.error('Invalid ID format:', id);
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  // Create a MongoDB ObjectId from the ID string
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    console.error('Invalid ObjectId format:', id);
    return res.status(400).json({ success: false, error: 'Invalid MongoDB ObjectId format' });
  }

  switch (method) {
    case 'GET':
      try {
        console.log(`Looking up edition with ObjectId: ${objectId}`);
        const edition = await Edition.findById(objectId);

        if (!edition) {
          console.log(`Edition not found with ID: ${id}`);
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }

        console.log(`Found edition: ${edition.name} (${edition.franchise})`);
        res.status(200).json({ success: true, data: edition });
      } catch (error) {
        const mongoError = error as MongoError;
        console.error('Error fetching edition:', mongoError);
        res.status(400).json({ success: false, error: mongoError.message });
      }
      break;
      
    case 'PUT':
      try {
        console.log('PUT request to update edition with ID:', id);
        console.log('Request body:', req.body);
        
        // Get the old edition first to check if retail price changed
        const oldEdition = await Edition.findById(id);
        
        if (!oldEdition) {
          console.error('Edition not found with ID:', id);
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        
        console.log('Found edition:', oldEdition);
        
        // If we're only updating isDefault, skip the name/franchise validation
        const isOnlyUpdatingDefault = 
          Object.keys(req.body).length === 1 && 
          req.body.isDefault !== undefined;
        
        // Check if name or franchise is changing and if the new combination already exists
        if (!isOnlyUpdatingDefault && 
            ((req.body.name && req.body.name !== oldEdition.name) || 
             (req.body.franchise && req.body.franchise !== oldEdition.franchise))) {
          const nameToCheck = req.body.name || oldEdition.name;
          const franchiseToCheck = req.body.franchise || oldEdition.franchise;
          
          const existingEdition = await Edition.findOne({
            _id: { $ne: id }, // Exclude the current edition
            name: nameToCheck,
            franchise: franchiseToCheck
          });
          
          if (existingEdition) {
            return res.status(400).json({ 
              success: false, 
              error: `An edition named "${nameToCheck}" already exists for the "${franchiseToCheck}" franchise` 
            });
          }
        }
        
        // Check if internal name is changing and if the new internal name already exists
        if (!isOnlyUpdatingDefault && 
            req.body.internalName && req.body.internalName !== oldEdition.internalName) {
          const existingInternalName = await Edition.findOne({
            _id: { $ne: id }, // Exclude the current edition
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
          // Get the franchise of the edition being updated
          const franchiseToUpdate = req.body.franchise || oldEdition.franchise;
          
          // Unset isDefault for all other editions in the same franchise
          await Edition.updateMany(
            { 
              _id: { $ne: id }, // All editions except this one
              franchise: franchiseToUpdate // Only editions in the same franchise
            },
            { isDefault: false }
          );
        }
        
        // Update the edition - internalName will be regenerated if name or franchise changes
        const updatedEdition = await Edition.findByIdAndUpdate(
          id,
          { 
            name: req.body.name !== undefined ? req.body.name : oldEdition.name,
            internalName: req.body.internalName !== undefined ? req.body.internalName : oldEdition.internalName,
            description: req.body.description !== undefined ? req.body.description : oldEdition.description,
            retailPrice: req.body.retailPrice !== undefined ? req.body.retailPrice : oldEdition.retailPrice,
            franchise: req.body.franchise !== undefined ? req.body.franchise : oldEdition.franchise,
            isDefault: req.body.isDefault !== undefined ? req.body.isDefault : oldEdition.isDefault
          },
          { new: true, runValidators: true }
        );
        
        // Check if retail price changed and updateStarships is true
        const retailPriceChanged = 
          req.body.retailPrice !== undefined && 
          oldEdition.retailPrice !== req.body.retailPrice;
        
        if (updateStarships && retailPriceChanged && updatedEdition) {
          // Update all starships with this edition to have the new retail price
          await Starship.updateMany(
            { edition: updatedEdition.name, retailPrice: { $exists: false } },
            { retailPrice: null }
          );
          
          await Starship.updateMany(
            { edition: updatedEdition.name },
            { retailPrice: parseFloat(req.body.retailPrice) }
          );
        }
        
        res.status(200).json({ success: true, data: updatedEdition });
      } catch (error: unknown) {
        console.error('Error updating edition:', error);
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
      
    case 'DELETE':
      try {
        const deletedEdition = await Edition.findByIdAndDelete(id);
        
        if (!deletedEdition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        console.error('Error deleting edition:', error);
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