import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import Manufacturer from '../../../models/Manufacturer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get all manufacturers
    const manufacturers = await Manufacturer.find({});
    
    if (manufacturers.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No manufacturers found. Please create manufacturers first.',
        manufacturerCount: 0
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
    
    // Get all starships
    const allStarships = await Starship.find({});
    
    // Count starships with and without manufacturers
    const stats = {
      total: allStarships.length,
      withManufacturer: 0,
      withoutManufacturer: 0,
      withFranchise: 0,
      withoutFranchise: 0,
      franchiseHasManufacturer: 0,
      franchiseNoManufacturer: 0,
      sampleStarships: [] as Array<any>
    };
    
    // Analyze each starship
    allStarships.forEach(starship => {
      // Check if it has a manufacturer
      if (starship.manufacturer) {
        stats.withManufacturer++;
      } else {
        stats.withoutManufacturer++;
      }
      
      // Check if it has a franchise
      if (starship.franchise) {
        stats.withFranchise++;
        
        // Check if the franchise has an associated manufacturer
        if (franchiseManufacturerMap.has(starship.franchise)) {
          stats.franchiseHasManufacturer++;
        } else {
          stats.franchiseNoManufacturer++;
        }
      } else {
        stats.withoutFranchise++;
      }
      
      // Add a few sample starships for inspection
      if (stats.sampleStarships.length < 5) {
        stats.sampleStarships.push({
          id: starship._id.toString(),
          issue: starship.issue,
          edition: starship.edition,
          shipName: starship.shipName,
          franchise: starship.franchise || 'N/A',
          manufacturer: starship.manufacturer || 'N/A',
          editionInternalName: starship.editionInternalName || 'N/A'
        });
      }
    });
    
    // Get manufacturer details
    const manufacturerDetails = manufacturers.map(m => ({
      name: m.name,
      franchises: m.franchises || []
    }));
    
    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Manufacturer status check completed',
      stats,
      manufacturers: manufacturerDetails,
      franchiseManufacturerMap: Object.fromEntries(franchiseManufacturerMap)
    });
  } catch (error: any) {
    console.error('Error checking manufacturer status:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 