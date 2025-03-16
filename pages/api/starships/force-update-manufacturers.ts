import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import Manufacturer from '../../../models/Manufacturer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get parameters from request body
    const { 
      franchise = "Star Trek",
      manufacturerName = "Eaglemoss",
      forceUpdate = true
    } = req.body;
    
    // Get all manufacturers
    const manufacturers = await Manufacturer.find({});
    
    if (manufacturers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No manufacturers found. Please create manufacturers first.' 
      });
    }
    
    // Find the manufacturer by name
    const manufacturer = manufacturers.find(m => m.name === manufacturerName);
    
    if (!manufacturer) {
      return res.status(400).json({ 
        success: false, 
        error: `Manufacturer "${manufacturerName}" not found.` 
      });
    }
    
    // Build the query based on parameters
    const query: any = { franchise };
    
    if (!forceUpdate) {
      // Only update starships without a manufacturer
      query.$or = [
        { manufacturer: { $exists: false } },
        { manufacturer: null },
        { manufacturer: "" }
      ];
    }
    
    // Get starships based on the query
    const starships = await Starship.find(query);
    
    if (starships.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No starships found matching the criteria.',
        count: 0
      });
    }
    
    // Track statistics
    const stats = {
      total: starships.length,
      updated: 0,
      errors: 0,
      affectedShips: [] as Array<{id: string, name: string}>
    };
    
    // Update each starship with the specified manufacturer
    const updatePromises = starships.map(async (starship) => {
      try {
        // Skip if already has the correct manufacturer and not forcing update
        if (!forceUpdate && starship.manufacturer === manufacturerName) {
          return;
        }
        
        // Update the manufacturer field directly in the database
        await Starship.updateOne(
          { _id: starship._id },
          { $set: { manufacturer: manufacturerName } }
        );
        
        stats.updated++;
        stats.affectedShips.push({
          id: starship._id.toString(),
          name: starship.shipName
        });
      } catch (error) {
        console.error(`Error updating starship ${starship._id}:`, error);
        stats.errors++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Send success response
    return res.status(200).json({
      success: true,
      message: `Updated ${stats.updated} of ${stats.total} starships with manufacturer "${manufacturerName}".`,
      stats
    });
  } catch (error: any) {
    console.error('Error force updating manufacturers:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 