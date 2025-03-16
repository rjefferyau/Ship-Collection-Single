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

    // Check if we should overwrite existing manufacturers
    const { overwriteExisting = false } = req.body;

    // Get all manufacturers
    const manufacturers = await Manufacturer.find({});
    
    if (manufacturers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No manufacturers found. Please create manufacturers first.' 
      });
    }

    // Create a map of franchise to manufacturer
    const franchiseManufacturerMap = new Map<string, string>();
    
    // For each manufacturer, add its associated franchises to the map
    manufacturers.forEach(manufacturer => {
      if (manufacturer.franchises && manufacturer.franchises.length > 0) {
        manufacturer.franchises.forEach((franchise: string) => {
          franchiseManufacturerMap.set(franchise, manufacturer.name);
        });
      }
    });

    // Build the query based on whether we should overwrite existing manufacturers
    const query: any = overwriteExisting 
      ? {} // Get all starships if overwriting
      : { $or: [{ manufacturer: { $exists: false } }, { manufacturer: null }, { manufacturer: "" }] }; // Only get starships without a manufacturer
    
    // Get starships based on the query
    const starships = await Starship.find(query);
    
    // Track statistics
    const stats = {
      total: starships.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      alreadyAssigned: 0
    };
    
    // Update each starship with a manufacturer based on its franchise
    const updatePromises = starships.map(async (starship) => {
      try {
        // Skip if no franchise
        if (!starship.franchise) {
          stats.skipped++;
          return;
        }
        
        // Skip if already has a manufacturer and we're not overwriting
        if (!overwriteExisting && starship.manufacturer) {
          stats.alreadyAssigned++;
          return;
        }
        
        const manufacturer = franchiseManufacturerMap.get(starship.franchise);
        
        if (manufacturer) {
          // Skip if the manufacturer is already assigned and matches
          if (starship.manufacturer === manufacturer) {
            stats.alreadyAssigned++;
            return;
          }
          
          starship.manufacturer = manufacturer;
          await starship.save();
          stats.updated++;
        } else {
          stats.skipped++;
        }
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
      message: `Processed ${stats.total} starships: ${stats.updated} updated, ${stats.skipped} skipped (no matching manufacturer), ${stats.alreadyAssigned} already had manufacturers, ${stats.errors} errors.`,
      stats
    });
  } catch (error: any) {
    console.error('Error assigning default manufacturers:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 