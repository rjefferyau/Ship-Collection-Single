import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../lib/mongodb';
import Starship from '../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const db = mongoose.connection.db;
    
    // 1. Check for legacy collections (v3, v4)
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const legacyCollections = {
      starshipv3: collectionNames.includes('starshipv3'),
      starshipv4: collectionNames.includes('starshipv4'),
      counts: {
        starshipv3: collectionNames.includes('starshipv3') ? 
          await db.collection('starshipv3').countDocuments() : 0,
        starshipv4: collectionNames.includes('starshipv4') ? 
          await db.collection('starshipv4').countDocuments() : 0,
        starshipv5: collectionNames.includes('starshipv5') ? 
          await db.collection('starshipv5').countDocuments() : 0
      }
    };
    
    // 2. Check if the ID mapping collection exists
    const idMappingExists = collectionNames.includes('starshipIdMapping');
    const idMappingCount = idMappingExists ? 
      await db.collection('starshipIdMapping').countDocuments() : 0;
    
    // 3. Check for unused fields in Starship documents
    // Sample 100 random documents for analysis
    const sampleSize = 100;
    const starshipSample = await Starship.aggregate([
      { $sample: { size: sampleSize } }
    ]);
    
    // Initialize counters for each field to track usage
    const fieldUsage: Record<string, { count: number, percentage: number }> = {};
    
    // Count the number of documents where each field is used
    const fieldKeys = new Set<string>();
    starshipSample.forEach(ship => {
      Object.keys(ship).forEach(key => {
        fieldKeys.add(key);
        if (!fieldUsage[key]) {
          fieldUsage[key] = { count: 0, percentage: 0 };
        }
        
        // Check if the field has a value
        if (ship[key] !== null && ship[key] !== undefined) {
          fieldUsage[key].count++;
        }
      });
    });
    
    // Calculate percentage usage for each field
    fieldKeys.forEach(key => {
      fieldUsage[key].percentage = (fieldUsage[key].count / sampleSize) * 100;
    });
    
    // Sort fields by usage percentage (ascending)
    const sortedFieldUsage = Object.entries(fieldUsage)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, { count: number, percentage: number }>);
    
    // Identify potentially unused or rarely used fields (less than 10% usage)
    const unusedFields = Object.entries(sortedFieldUsage)
      .filter(([_, value]) => value.percentage < 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, { count: number, percentage: number }>);
    
    return res.status(200).json({
      success: true,
      legacyCollections,
      idMapping: {
        exists: idMappingExists,
        count: idMappingCount
      },
      fieldUsage: {
        sampleSize,
        unusedFields,
        allFields: sortedFieldUsage
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 