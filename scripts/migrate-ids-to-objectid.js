#!/usr/bin/env node

/**
 * Database Migration Script: Convert String IDs to ObjectIds
 * 
 * This script migrates the starshipv5 collection to use proper MongoDB ObjectIds
 * instead of string IDs, eliminating the ID format inconsistency issues.
 * 
 * IMPORTANT: Run backup before executing this script!
 */

const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';
const DB_NAME = 'ship-collection-v2';
const COLLECTION_NAME = 'starshipv5';

async function migrateStringIdsToObjectIds() {
  console.log('🚀 Starting ID migration from string to ObjectId...');
  console.log(`📁 Database: ${DB_NAME}`);
  console.log(`📋 Collection: ${COLLECTION_NAME}`);
  
  let client;
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all documents with string _id
    console.log('🔍 Finding documents with string _id...');
    const stringIdDocs = await collection.find({ _id: { $type: "string" } }).toArray();
    console.log(`📊 Found ${stringIdDocs.length} documents with string _id`);
    
    if (stringIdDocs.length === 0) {
      console.log('✅ No string IDs found. Migration not needed.');
      return;
    }
    
    // Create a temporary collection for the migration
    const tempCollectionName = `${COLLECTION_NAME}_temp_migration`;
    const tempCollection = db.collection(tempCollectionName);
    
    console.log(`🔄 Creating temporary collection: ${tempCollectionName}`);
    
    // Process documents in batches
    const batchSize = 50;
    const totalDocs = stringIdDocs.length;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`📦 Processing ${totalDocs} documents in batches of ${batchSize}...`);
    
    for (let i = 0; i < stringIdDocs.length; i += batchSize) {
      const batch = stringIdDocs.slice(i, i + batchSize);
      
      for (const doc of batch) {
        try {
          const oldId = doc._id;
          
          // Create new ObjectId
          const newObjectId = new ObjectId();
          
          // Create new document with ObjectId _id
          const newDoc = {
            ...doc,
            _id: newObjectId,
            migratedFrom: oldId, // Keep track of original ID
            migratedAt: new Date()
          };
          
          // Insert into temporary collection
          await tempCollection.insertOne(newDoc);
          
          processedCount++;
          successCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`✅ Processed ${processedCount}/${totalDocs} documents`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing document ${doc._id}:`, error.message);
          errorCount++;
          processedCount++;
        }
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`   Total documents: ${totalDocs}`);
    console.log(`   Successfully processed: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('❌ Migration had errors. Please review and fix before proceeding.');
      return;
    }
    
    // Verify the temporary collection has the correct count
    const tempCount = await tempCollection.countDocuments();
    if (tempCount !== successCount) {
      console.error(`❌ Count mismatch! Expected ${successCount}, got ${tempCount}`);
      return;
    }
    
    console.log('✅ All documents successfully migrated to temporary collection');
    
    // Create backup collection name
    const backupCollectionName = `${COLLECTION_NAME}_backup_${Date.now()}`;
    
    console.log(`🔄 Renaming original collection to backup: ${backupCollectionName}`);
    await collection.rename(backupCollectionName);
    
    console.log(`🔄 Renaming temporary collection to active: ${COLLECTION_NAME}`);
    await tempCollection.rename(COLLECTION_NAME);
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📁 Original data backed up as: ${backupCollectionName}`);
    console.log(`✨ New collection ${COLLECTION_NAME} now uses ObjectId _id fields`);
    
    // Verify the migration
    const newCollection = db.collection(COLLECTION_NAME);
    const objectIdCount = await newCollection.countDocuments({ _id: { $type: "objectId" } });
    console.log(`✅ Verification: ${objectIdCount} documents now have ObjectId _id`);
    
    // Test a sample record
    const sampleDoc = await newCollection.findOne({});
    if (sampleDoc) {
      console.log(`🔍 Sample migrated document _id: ${sampleDoc._id} (type: ${typeof sampleDoc._id})`);
      console.log(`📋 Original ID was: ${sampleDoc.migratedFrom}`);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateStringIdsToObjectIds()
    .then(() => {
      console.log('\n🎊 ID Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateStringIdsToObjectIds };