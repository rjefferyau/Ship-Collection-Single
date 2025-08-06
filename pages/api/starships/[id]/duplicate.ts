import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  await dbConnect();

  switch (method) {
    case 'POST':
      try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id as string)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid starship ID format'
          });
        }

        const objectId = new mongoose.Types.ObjectId(id as string);

        // Find the original starship
        const originalStarship = await Starship.findById(objectId);
        
        if (!originalStarship) {
          return res.status(404).json({
            success: false,
            error: 'Starship not found'
          });
        }

        // Create a duplicate with modified properties
        const duplicateData = originalStarship.toObject();
        
        // Remove the _id to create a new document
        delete duplicateData._id;
        
        // Modify the duplicate to show it's a copy
        duplicateData.issue = duplicateData.issue + ' (Copy)';
        duplicateData.shipName = duplicateData.shipName + ' - Variant';
        
        // Reset status fields for the duplicate
        duplicateData.owned = false;
        duplicateData.wishlist = false;
        duplicateData.onOrder = false;
        duplicateData.notInterested = false;
        duplicateData.wishlistPriority = undefined;
        duplicateData.pricePaid = undefined;
        duplicateData.orderDate = undefined;
        
        // Clear image URL so user can add a different image
        duplicateData.imageUrl = undefined;
        duplicateData.magazinePdfUrl = undefined;

        // Create the duplicate
        const duplicateStarship = await Starship.create(duplicateData);

        res.status(201).json({
          success: true,
          data: duplicateStarship,
          message: 'Starship duplicated successfully'
        });
      } catch (error) {
        console.error('Error duplicating starship:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to duplicate starship'
        });
      }
      break;

    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}