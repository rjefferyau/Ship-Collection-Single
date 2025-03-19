import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../lib/mongodb';
import Starship from '../../models/Starship';
import Edition from '../../models/Edition';
import Faction from '../../models/Faction';
import Franchise from '../../models/Franchise';
import CollectionType from '../../models/CollectionType';
import Manufacturer from '../../models/Manufacturer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const { action } = req.body;
    
    if (!action) {
      return res.status(400).json({ success: false, error: 'Action parameter is required' });
    }
    
    const results: any = {
      success: true,
      actions: []
    };
    
    // Cleanup actions
    switch (action) {
      case 'remove_legacy_collections':
        // Delete starshipv3 and starshipv4 collections if they exist
        if (collectionNames.includes('starshipv3')) {
          await db.dropCollection('starshipv3');
          results.actions.push('Removed starshipv3 collection');
        }
        
        if (collectionNames.includes('starshipv4')) {
          await db.dropCollection('starshipv4');
          results.actions.push('Removed starshipv4 collection');
        }
        break;
      
      case 'remove_mapping_collection':
        // Delete starshipIdMapping collection if it exists
        if (collectionNames.includes('starshipIdMapping')) {
          await db.dropCollection('starshipIdMapping');
          results.actions.push('Removed starshipIdMapping collection');
        } else {
          results.actions.push('starshipIdMapping collection does not exist');
        }
        break;
      
      case 'remove_orphaned_editions':
        // Find and remove orphaned editions
        const starships = await Starship.find({}).lean();
        const editions = await Edition.find({}).lean();
        
        const usedEditions = new Set(starships.map(s => (s as any).edition));
        const orphanedEditions = editions.filter(e => !usedEditions.has(e.name));
        
        if (orphanedEditions.length > 0) {
          const orphanedIds = orphanedEditions.map(e => e._id);
          const deleteResult = await Edition.deleteMany({ _id: { $in: orphanedIds } });
          results.actions.push(`Removed ${deleteResult.deletedCount} orphaned editions`);
        } else {
          results.actions.push('No orphaned editions found');
        }
        break;
      
      case 'remove_orphaned_factions':
        // Find and remove orphaned factions
        const starshipsForFaction = await Starship.find({}).lean();
        const factions = await Faction.find({}).lean();
        
        const usedFactions = new Set(starshipsForFaction.map(s => (s as any).faction));
        const orphanedFactions = factions.filter(f => !usedFactions.has(f.name));
        
        if (orphanedFactions.length > 0) {
          const orphanedIds = orphanedFactions.map(f => f._id);
          const deleteResult = await Faction.deleteMany({ _id: { $in: orphanedIds } });
          results.actions.push(`Removed ${deleteResult.deletedCount} orphaned factions`);
        } else {
          results.actions.push('No orphaned factions found');
        }
        break;
      
      case 'remove_orphaned_franchises':
        // Find and remove orphaned franchises
        const starshipsForFranchise = await Starship.find({}).lean();
        const franchises = await Franchise.find({}).lean();
        
        const usedFranchises = new Set(starshipsForFranchise.map(s => (s as any).franchise).filter(Boolean));
        const orphanedFranchises = franchises.filter(f => !usedFranchises.has(f.name));
        
        if (orphanedFranchises.length > 0) {
          const orphanedIds = orphanedFranchises.map(f => f._id);
          const deleteResult = await Franchise.deleteMany({ _id: { $in: orphanedIds } });
          results.actions.push(`Removed ${deleteResult.deletedCount} orphaned franchises`);
        } else {
          results.actions.push('No orphaned franchises found');
        }
        break;
      
      case 'remove_orphaned_collection_types':
        // Find and remove orphaned collection types
        const starshipsForCollectionType = await Starship.find({}).lean();
        const collectionTypes = await CollectionType.find({}).lean();
        
        const usedCollectionTypes = new Set(starshipsForCollectionType.map(s => (s as any).collectionType).filter(Boolean));
        const orphanedCollectionTypes = collectionTypes.filter(c => !usedCollectionTypes.has(c.name));
        
        if (orphanedCollectionTypes.length > 0) {
          const orphanedIds = orphanedCollectionTypes.map(c => c._id);
          const deleteResult = await CollectionType.deleteMany({ _id: { $in: orphanedIds } });
          results.actions.push(`Removed ${deleteResult.deletedCount} orphaned collection types`);
        } else {
          results.actions.push('No orphaned collection types found');
        }
        break;
      
      case 'remove_orphaned_manufacturers':
        // Find and remove orphaned manufacturers
        const starshipsForManufacturer = await Starship.find({}).lean();
        const manufacturers = await Manufacturer.find({}).lean();
        
        const usedManufacturers = new Set(starshipsForManufacturer.map(s => (s as any).manufacturer).filter(Boolean));
        const orphanedManufacturers = manufacturers.filter(m => !usedManufacturers.has(m.name));
        
        if (orphanedManufacturers.length > 0) {
          const orphanedIds = orphanedManufacturers.map(m => m._id);
          const deleteResult = await Manufacturer.deleteMany({ _id: { $in: orphanedIds } });
          results.actions.push(`Removed ${deleteResult.deletedCount} orphaned manufacturers`);
        } else {
          results.actions.push('No orphaned manufacturers found');
        }
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: remove_legacy_collections, remove_mapping_collection, remove_orphaned_editions, remove_orphaned_factions, remove_orphaned_franchises, remove_orphaned_collection_types, remove_orphaned_manufacturers'
        });
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in database cleanup:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 