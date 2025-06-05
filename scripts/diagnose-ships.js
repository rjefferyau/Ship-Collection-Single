// Diagnostic script to see what's in the database
const { MongoClient } = require('mongodb');

async function diagnoseShips() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    console.log('Using URI:', uri);
    
    // List all databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    console.log('\nAvailable databases:');
    databases.databases.forEach(db => console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`));
    
    // Try different database names
    const possibleDatabases = ['ship-collection', 'test', 'StarTrekCollection', 'nextjs-mui-mongodb'];
    
    for (const dbName of possibleDatabases) {
      console.log(`\n=== Checking database: ${dbName} ===`);
      
      try {
        const db = client.db(dbName);
        
        // List all collections in this database
        const collections = await db.listCollections().toArray();
        console.log(`Collections in ${dbName}:`);
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // Try different collection names
        const possibleCollections = ['starshipv5', 'starships', 'Starship'];
        
        for (const collectionName of possibleCollections) {
          console.log(`\n--- Checking ${dbName}.${collectionName} ---`);
          
          try {
            const collection = db.collection(collectionName);
            const count = await collection.countDocuments();
            console.log(`Total documents: ${count}`);
            
            if (count > 0) {
              // Get a few sample documents
              const samples = await collection.find({}).limit(3).toArray();
              
              console.log('Sample documents:');
              samples.forEach((ship, index) => {
                console.log(`\nShip ${index + 1}:`);
                console.log(`  _id: ${ship._id}`);
                console.log(`  shipName: ${ship.shipName || 'N/A'}`);
                console.log(`  edition: ${ship.edition || 'N/A'}`);
                console.log(`  editionInternalName: ${ship.editionInternalName || 'MISSING'}`);
                console.log(`  collectionType: ${ship.collectionType || 'MISSING'}`);
                console.log(`  franchise: ${ship.franchise || 'MISSING'}`);
              });
              
              // Check specifically for Discovery ships
              const discoveryShips = await collection.find({ 
                edition: { $regex: /discovery/i } 
              }).toArray();
              
              console.log(`Discovery ships found: ${discoveryShips.length}`);
              
              // Count ships missing fields
              const missingFields = await collection.find({
                $or: [
                  { editionInternalName: { $exists: false } },
                  { editionInternalName: "" },
                  { editionInternalName: null },
                  { collectionType: { $exists: false } },
                  { collectionType: "" },
                  { collectionType: null },
                  { franchise: { $exists: false } },
                  { franchise: "" },
                  { franchise: null }
                ]
              }).toArray();
              
              console.log(`Ships missing key fields: ${missingFields.length}`);
            }
          } catch (error) {
            console.log(`  Collection ${collectionName} not accessible: ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`  Database ${dbName} not accessible: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

diagnoseShips(); 