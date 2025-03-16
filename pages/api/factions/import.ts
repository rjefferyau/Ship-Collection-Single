import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Faction from '../../../models/Faction';
import Starship from '../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Get all unique factions from the starships collection
    const starships = await Starship.find({}, 'faction');
    
    // Extract unique faction names
    const uniqueFactions = new Set<string>();
    starships.forEach(ship => {
      if (ship.faction && ship.faction.trim() !== '') {
        uniqueFactions.add(ship.faction.trim());
      }
    });
    
    const factionArray = Array.from(uniqueFactions);
    
    // Check which factions already exist in the factions collection
    const existingFactions = await Faction.find({ 
      name: { $in: factionArray } 
    }, 'name');
    
    const existingFactionNames = new Set(existingFactions.map(f => f.name));
    
    // Filter out factions that already exist
    const newFactions = factionArray.filter(name => !existingFactionNames.has(name));
    
    // Create new faction documents
    const factionsToCreate = newFactions.map(name => ({
      name,
      description: `Imported from CollectHub`
    }));
    
    // Insert the new factions
    let result;
    if (factionsToCreate.length > 0) {
      result = await Faction.insertMany(factionsToCreate);
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        total: uniqueFactions.size,
        existing: existingFactionNames.size,
        imported: factionsToCreate.length,
        factions: result || []
      }
    });
  } catch (error) {
    console.error('Error importing factions:', error);
    res.status(500).json({ success: false, error });
  }
} 