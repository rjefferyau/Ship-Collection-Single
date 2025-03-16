import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/dbConnect';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  console.log(`Toggle wishlist API called for ID: ${id}, Method: ${method}`);

  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    if (method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
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
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    console.log(`Found starship: ${starship._id}`);
    
    // Toggle the wishlist status
    console.log(`Current wishlist status: ${starship.wishlist}, toggling to: ${!starship.wishlist}`);
    const newWishlistStatus = !starship.wishlist;
    
    // Update the wishlist status
    starship.wishlist = newWishlistStatus;
    
    // If adding to wishlist, set a default priority if not already set
    if (newWishlistStatus && !starship.wishlistPriority) {
      console.log(`Adding to wishlist, setting priority`);
      
      // Get the highest priority number currently in use
      const highestPriorityDoc = await Starship.findOne({ wishlist: true })
        .sort({ wishlistPriority: -1 })
        .limit(1);
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
        ? highestPriorityDoc.wishlistPriority + 1 
        : 1;
      
      console.log(`Setting wishlist priority to: ${nextPriority}`);
      starship.wishlistPriority = nextPriority;
    }
    
    // If removing from wishlist, clear the priority
    if (!newWishlistStatus) {
      console.log(`Removing from wishlist, clearing priority`);
      starship.wishlistPriority = undefined;
    }
    
    console.log(`Updating starship ${starship._id}`);
    
    // Save the updated starship
    await starship.save();
    
    console.log(`Starship updated successfully`);
    
    return res.status(200).json({ 
      success: true, 
      data: starship,
      message: newWishlistStatus ? 'Added to wishlist' : 'Removed from wishlist'
    });
  } catch (error: any) {
    console.error('Error toggling wishlist status:', error);
    return res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 