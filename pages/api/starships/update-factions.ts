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
    // Get all factions
    const factions = await Faction.find({}, 'name');
    
    if (factions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No factions found. Please import or create factions first.' 
      });
    }
    
    // Create a map of faction names (case insensitive) to their canonical names
    const factionMap = new Map<string, string>();
    factions.forEach(faction => {
      factionMap.set(faction.name.toLowerCase(), faction.name);
    });
    
    // Get all starships
    const starships = await Starship.find({});
    
    // Track statistics
    const stats = {
      total: starships.length,
      updated: 0,
      unchanged: 0,
      errors: 0
    };
    
    // Update each starship with the canonical faction name
    const updatePromises = starships.map(async (starship) => {
      try {
        if (!starship.faction) {
          stats.unchanged++;
          return;
        }
        
        const normalizedFaction = starship.faction.toLowerCase().trim();
        const canonicalFaction = factionMap.get(normalizedFaction);
        
        if (canonicalFaction && canonicalFaction !== starship.faction) {
          starship.faction = canonicalFaction;
          await starship.save();
          stats.updated++;
        } else {
          stats.unchanged++;
        }
      } catch (error) {
        console.error(`Error updating starship ${starship._id}:`, error);
        stats.errors++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      success: true, 
      data: stats
    });
  } catch (error) {
    console.error('Error updating starship factions:', error);
    res.status(500).json({ success: false, error });
  }
} 