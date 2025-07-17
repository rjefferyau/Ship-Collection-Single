import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';

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

    // Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid MongoDB ObjectId format: ${id}`);
      return res.status(400).json({ success: false, error: 'Invalid ObjectId format' });
    }

    // Use direct collection access
    const collection = mongoose.connection.collection('starshipv5');
    
    console.log(`Looking for starship with ID: ${id}`);
    const starship = await collection.findOne({ _id: id });
    
    if (!starship) {
      console.log(`Starship not found with ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Starship not found' });
    }
    
    console.log(`Found starship: ${starship._id}`);
    
    // Toggle the wishlist status
    console.log(`Current wishlist status: ${starship.wishlist}, toggling to: ${!starship.wishlist}`);
    const newWishlistStatus = !starship.wishlist;
    
    // Prepare update fields
    let updateFields = {
      wishlist: newWishlistStatus,
      updatedAt: new Date()
    };
    
    // If adding to wishlist, set a default priority if not already set
    if (newWishlistStatus && !starship.wishlistPriority) {
      console.log(`Adding to wishlist, setting priority`);
      
      // Get the highest priority number currently in use
      const highestPriorityDoc = await collection.findOne(
        { wishlist: true },
        { sort: { wishlistPriority: -1 }, limit: 1 }
      );
      
      // Set the new priority to be one higher than the current highest
      const nextPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
        ? highestPriorityDoc.wishlistPriority + 1 
        : 1;
      
      console.log(`Setting wishlist priority to: ${nextPriority}`);
      updateFields.wishlistPriority = nextPriority;
    }
    
    // If removing from wishlist, clear the priority
    if (!newWishlistStatus) {
      console.log(`Removing from wishlist, clearing priority`);
      updateFields.wishlistPriority = null;
    }
    
    console.log(`Updating starship ${starship._id}`);
    
    // Update the document directly
    const result = await collection.updateOne(
      { _id: id },
      { $set: updateFields }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: 'Update failed' });
    }
    
    console.log(`Starship updated successfully`);
    
    // Get the updated document
    const updatedStarship = await collection.findOne({ _id: id });
    
    return res.status(200).json({ 
      success: true, 
      data: {
        ...updatedStarship,
        _id: updatedStarship._id.toString()
      },
      message: newWishlistStatus ? 'Added to wishlist' : 'Removed from wishlist'
    });
  } catch (error: any) {
    console.error('Error toggling wishlist status:', error);
    return res.status(400).json({ success: false, error: error.message || 'An error occurred' });
  }
} 