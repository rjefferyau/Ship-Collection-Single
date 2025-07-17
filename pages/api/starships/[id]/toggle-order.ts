import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  console.log(`Toggle order API called for ID: ${id}, Method: ${req.method}`);
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    console.log('Connected to MongoDB');
    
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
    
    const { onOrder, pricePaid, orderDate } = req.body;
    
    // Use direct collection access to bypass model issues
    const collection = mongoose.connection.collection('starshipv5');
    
    console.log(`Looking for starship with ID: ${id}`);
    console.log(`Database: ${mongoose.connection.db.databaseName}, Collection: ${collection.collectionName}`);
    
    // Debug: check total documents
    const totalDocs = await collection.countDocuments();
    console.log(`Total documents in collection: ${totalDocs}`);
    
    const starship = await collection.findOne({ _id: id });
    
    if (!starship) {
      console.log(`Starship not found with ID: ${id}`);
      // Try to find any similar ID or any document at all
      const anyDoc = await collection.findOne({});
      console.log(`Sample document ID: ${anyDoc?._id?.toString()}`);
      
      return res.status(404).json({ 
        success: false, 
        message: `Starship not found with ID: ${id}`,
        debug: {
          totalDocuments: totalDocs,
          sampleId: anyDoc?._id?.toString(),
          database: mongoose.connection.db.databaseName
        }
      });
    }
    
    console.log(`Starship found: ${starship.shipName}`);
    
    // Prepare update operations
    let updateFields = { updatedAt: new Date() };
    
    if (onOrder) {
      updateFields.onOrder = true;
      updateFields.pricePaid = pricePaid || null;
      updateFields.orderDate = orderDate ? new Date(orderDate) : new Date();
      
      // If it was on the wishlist, remove it from the wishlist
      if (starship.wishlist) {
        updateFields.wishlist = false;
        updateFields.wishlistPriority = null;
      }
    } else {
      // If removing from order, clear the price paid and order date
      updateFields.onOrder = false;
      updateFields.pricePaid = null;
      updateFields.orderDate = null;
      
      // Add it back to the wishlist
      updateFields.wishlist = true;
      
      // Find the highest priority in the wishlist to add this at the end
      const highestPriorityDoc = await collection.findOne(
        { wishlist: true },
        { sort: { wishlistPriority: -1 }, limit: 1 }
      );
      
      // Set the priority to one more than the highest, or 1 if there are no wishlist items
      updateFields.wishlistPriority = highestPriorityDoc && highestPriorityDoc.wishlistPriority 
        ? highestPriorityDoc.wishlistPriority + 1 
        : 1;
    }
    
    console.log(`Updating starship: ${starship.shipName}`);
    
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
    
    const sanitizedStarship = {
      ...updatedStarship,
      _id: updatedStarship._id.toString()
    };
    
    return res.status(200).json({ 
      success: true, 
      message: onOrder ? 'Starship marked as on order' : 'Starship removed from orders and added to wishlist',
      data: sanitizedStarship 
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating order status' });
  }
} 