const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'ship-collection-v2';

// Directory where exported JSON files are stored
const EXPORT_DIR = path.join(__dirname, 'mongodb_export');

async function migrateToAtlas() {
  console.log('Starting migration to MongoDB Atlas...');
  console.log(`Local URI: ${LOCAL_URI}`);
  console.log(`Atlas URI: ${ATLAS_URI.replace(/\/\/(.+?):(.+?)@/, '//***:***@')}`); // Hide credentials in logs
  
  try {
    // Check if export directory exists
    if (!fs.existsSync(EXPORT_DIR)) {
      console.error(`Export directory not found: ${EXPORT_DIR}`);
      console.log('Please run the export script first to create the export files.');
      return;
    }
    
    // Read metadata file
    const metadataPath = path.join(EXPORT_DIR, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.error('Metadata file not found. Please run the export script first.');
      return;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`Found ${metadata.collections.length} collections to migrate`);
    
    // Connect to MongoDB Atlas
    console.log('Connecting to MongoDB Atlas...');
    const atlasClient = new MongoClient(ATLAS_URI);
    await atlasClient.connect();
    console.log('Connected to MongoDB Atlas');
    
    // Import each collection
    for (const collectionName of metadata.collections) {
      const collectionPath = path.join(EXPORT_DIR, `${collectionName}.json`);
      if (!fs.existsSync(collectionPath)) {
        console.error(`Collection file not found: ${collectionPath}`);
        continue;
      }
      
      console.log(`Importing collection: ${collectionName}`);
      const documents = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
      
      // Drop existing collection if it exists
      try {
        await atlasClient.db(DB_NAME).collection(collectionName).drop();
        console.log(`Dropped existing collection: ${collectionName}`);
      } catch (error) {
        // Collection might not exist, which is fine
        console.log(`No existing collection to drop: ${collectionName}`);
      }
      
      // Insert documents
      if (documents.length > 0) {
        const result = await atlasClient.db(DB_NAME).collection(collectionName).insertMany(documents);
        console.log(`Imported ${result.insertedCount} documents to ${collectionName}`);
      } else {
        console.log(`No documents to import for ${collectionName}`);
      }
    }
    
    // Close the connection
    await atlasClient.close();
    console.log('Migration to MongoDB Atlas completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Check if MONGODB_URI environment variable is set
if (!process.env.MONGODB_URI) {
  console.log('MONGODB_URI environment variable not set.');
  console.log('Please set it in your .env.local file or as an environment variable:');
  console.log('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ship-collection-v2?retryWrites=true&w=majority');
  process.exit(1);
}

// Run the migration
migrateToAtlas().catch(console.error); 