import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  console.log(`Toggle owned API called for ID: ${id}, Method: ${method}`);

  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    if (method !== 'PUT') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Check if the ID is valid
    if (typeof id !== 'string') {
      console.log(`Invalid ID format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }

    // Try to find the starship using the Starship model
    console.log(`Looking for starship with ID: ${id}`);
    
    // First try to find by direct ID
    let starship = await Starship.findById(id);
    
    // If not found, check if it's an old ID
    if (!starship && mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Starship not found with ID ${id}, checking if it's an old ID...`);
      
      // Try to find by originalId
      starship = await Starship.findOne({ originalId: new mongoose.Types.ObjectId(id) });
      
      // If still not found, check the ID mapping collection
      if (!starship) {
        const idMappingCollection = mongoose.connection.collection('starshipIdMapping');
        const mapping = await idMappingCollection.findOne({ oldId: new mongoose.Types.ObjectId(id) });
        
        if (mapping) {
          console.log(`Found ID mapping: ${id} -> ${mapping.newId}`);
          starship = await Starship.findById(mapping.newId);
        }
      }
    }
    
    if (!starship) {
      console.log(`Starship not found with ID ${id} or as originalId`);
      return res.status(404).json({ success: false, error: 'Starship not found' });
    }
    
    console.log(`Found starship: ${starship._id}`);
    
    // Toggle the owned status
    console.log(`Current owned status: ${starship.owned}, toggling to: ${!starship.owned}`);
    starship.owned = !starship.owned;
    
    // If marking as owned, clear wishlist and on-order status
    if (starship.owned) {
      starship.wishlist = false;
      starship.wishlistPriority = undefined;
      starship.onOrder = false;
    }
    
    // Save the updated starship
    await starship.save();
    
    console.log(`Starship updated successfully`);
    
    res.status(200).json({ success: true, data: starship });
  } catch (error: any) {
    console.error('Error in toggle-owned API:', error);
    res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 