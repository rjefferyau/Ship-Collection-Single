import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import Starship, { IStarship } from '../../models/Starship';
import Edition from '../../models/Edition';
import Faction from '../../models/Faction';
import Franchise from '../../models/Franchise';
import CollectionType from '../../models/CollectionType';
import Manufacturer from '../../models/Manufacturer';
import { Document } from 'mongoose';

// Custom interface for accessing any property on a document
interface AnyDocument extends Document {
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // 1. Get all editions, factions, franchises, collection types, and manufacturers
    const [editions, factions, franchises, collectionTypes, manufacturers, starships] = await Promise.all([
      Edition.find({}).lean(),
      Faction.find({}).lean(),
      Franchise.find({}).lean(),
      CollectionType.find({}).lean(),
      Manufacturer.find({}).lean(),
      Starship.find({}).lean()
    ]);
    
    // Extract unique values from starships for each reference field
    // Using type assertion to access dynamic properties
    const usedEditions = new Set(starships.map(s => (s as any).edition));
    const usedFactions = new Set(starships.map(s => (s as any).faction));
    const usedFranchises = new Set(starships.map(s => (s as any).franchise).filter(Boolean));
    const usedCollectionTypes = new Set(starships.map(s => (s as any).collectionType).filter(Boolean));
    const usedManufacturers = new Set(starships.map(s => (s as any).manufacturer).filter(Boolean));
    
    // Find orphaned records (no associated starships)
    const orphanedEditions = editions.filter(e => !usedEditions.has(e.name));
    const orphanedFactions = factions.filter(f => !usedFactions.has(f.name));
    const orphanedFranchises = franchises.filter(f => !usedFranchises.has(f.name));
    const orphanedCollectionTypes = collectionTypes.filter(c => !usedCollectionTypes.has(c.name));
    const orphanedManufacturers = manufacturers.filter(m => !usedManufacturers.has(m.name));
    
    // Count orphaned records
    const orphanedCounts = {
      editions: orphanedEditions.length,
      factions: orphanedFactions.length,
      franchises: orphanedFranchises.length,
      collectionTypes: orphanedCollectionTypes.length,
      manufacturers: orphanedManufacturers.length
    };
    
    // Calculate percentages
    const orphanedPercentages = {
      editions: editions.length > 0 ? (orphanedEditions.length / editions.length) * 100 : 0,
      factions: factions.length > 0 ? (orphanedFactions.length / factions.length) * 100 : 0,
      franchises: franchises.length > 0 ? (orphanedFranchises.length / franchises.length) * 100 : 0,
      collectionTypes: collectionTypes.length > 0 ? (orphanedCollectionTypes.length / collectionTypes.length) * 100 : 0,
      manufacturers: manufacturers.length > 0 ? (orphanedManufacturers.length / manufacturers.length) * 100 : 0
    };
    
    return res.status(200).json({
      success: true,
      totalCounts: {
        starships: starships.length,
        editions: editions.length,
        factions: factions.length,
        franchises: franchises.length,
        collectionTypes: collectionTypes.length,
        manufacturers: manufacturers.length
      },
      orphanedCounts,
      orphanedPercentages,
      orphanedRecords: {
        editions: orphanedEditions.map(e => e.name),
        factions: orphanedFactions.map(f => f.name),
        franchises: orphanedFranchises.map(f => f.name),
        collectionTypes: orphanedCollectionTypes.map(c => c.name),
        manufacturers: orphanedManufacturers.map(m => m.name)
      }
    });
  } catch (error) {
    console.error('Error checking orphaned records:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 