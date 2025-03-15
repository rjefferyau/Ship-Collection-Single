import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import mongoose from 'mongoose';
import Starship from '../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    console.log('Connected to MongoDB for database fix operation');

    // Step 1: Get all existing starships
    const existingStarships = await Starship.find({});
    console.log(`Found ${existingStarships.length} starships to process`);

    // Step 2: Create a mapping collection to store old and new IDs
    const idMappingCollection = mongoose.connection.collection('starshipIdMapping');
    
    // Check if the mapping collection already exists and has data
    const existingMappings = await idMappingCollection.countDocuments();
    if (existingMappings > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID mapping collection already exists. Please check the database first.' 
      });
    }

    // Step 3: Create a new collection for the fixed starships
    const fixedStarshipsCollection = mongoose.connection.collection('starshipv5');
    
    // Check if the new collection already exists and has data
    const existingFixedStarships = await fixedStarshipsCollection.countDocuments();
    if (existingFixedStarships > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target collection starshipv5 already exists and has data. Please check the database first.' 
      });
    }

    // Step 4: Process each starship
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      idMappings: [] as { oldId: string, newId: string }[]
    };

    for (const starship of existingStarships) {
      try {
        results.processed++;
        
        // Create a new ObjectId for this starship
        const newId = new mongoose.Types.ObjectId();
        
        // Store the mapping between old and new IDs
        await idMappingCollection.insertOne({
          oldId: starship._id,
          newId: newId,
          createdAt: new Date()
        });
        
        // Create a new starship document with the new ID
        const starshipData = starship.toObject();
        const { _id, ...starshipWithoutId } = starshipData;
        
        await fixedStarshipsCollection.insertOne({
          _id: newId,
          ...starshipWithoutId,
          originalId: _id, // Keep reference to the original ID
          updatedAt: new Date()
        });
        
        results.successful++;
        results.idMappings.push({
          oldId: starship._id.toString(),
          newId: newId.toString()
        });
        
        // Log progress every 10 items
        if (results.processed % 10 === 0) {
          console.log(`Processed ${results.processed}/${existingStarships.length} starships`);
        }
      } catch (error) {
        console.error(`Error processing starship ${starship._id}:`, error);
        results.failed++;
      }
    }

    // Step 5: Create indexes on the new collection
    await fixedStarshipsCollection.createIndex({ originalId: 1 });
    await fixedStarshipsCollection.createIndex({ issue: 1 });
    await fixedStarshipsCollection.createIndex({ edition: 1 });
    await fixedStarshipsCollection.createIndex({ shipName: 1 });
    await fixedStarshipsCollection.createIndex({ faction: 1 });
    await fixedStarshipsCollection.createIndex({ owned: 1 });
    await fixedStarshipsCollection.createIndex({ wishlist: 1 });
    await fixedStarshipsCollection.createIndex({ onOrder: 1 });

    // Step 6: Create indexes on the mapping collection
    await idMappingCollection.createIndex({ oldId: 1 });
    await idMappingCollection.createIndex({ newId: 1 });

    return res.status(200).json({
      success: true,
      message: 'Database fix operation completed',
      results: {
        totalStarships: existingStarships.length,
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        // Only include a sample of mappings in the response to keep it manageable
        idMappingsSample: results.idMappings.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error in database fix operation:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during the database fix operation',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 