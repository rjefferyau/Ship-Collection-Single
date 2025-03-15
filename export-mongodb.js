const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_URI = 'mongodb://localhost:27017';
const DB_NAME = 'ship-collection-v2';

// Directory where exported JSON files will be stored
const EXPORT_DIR = path.join(__dirname, 'mongodb_export');

async function exportMongoDB() {
  console.log('Starting MongoDB export...');
  console.log(`Local URI: ${LOCAL_URI}`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`Export directory: ${EXPORT_DIR}`);
  
  try {
    // Create export directory if it doesn't exist
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
      console.log(`Created export directory: ${EXPORT_DIR}`);
    }
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(LOCAL_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get list of collections
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);
    console.log(`Found ${collectionNames.length} collections: ${collectionNames.join(', ')}`);
    
    // Create metadata file
    const metadata = {
      database: DB_NAME,
      exportDate: new Date().toISOString(),
      collections: collectionNames
    };
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log('Created metadata file');
    
    // Export each collection
    for (const collectionName of collectionNames) {
      console.log(`Exporting collection: ${collectionName}`);
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      fs.writeFileSync(
        path.join(EXPORT_DIR, `${collectionName}.json`),
        JSON.stringify(documents, null, 2)
      );
      console.log(`Exported ${documents.length} documents from ${collectionName}`);
    }
    
    // Close the connection
    await client.close();
    console.log('MongoDB export completed successfully!');
    
  } catch (error) {
    console.error('Error during export:', error);
  }
}

// Run the export
exportMongoDB().catch(console.error); 