// Simple MongoDB fix for Discovery ships and other missing fields
const { MongoClient } = require('mongodb');

async function fixDiscoveryShips() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Try different databases that might contain the ships
    const possibleDatabases = ['ship-collection-v2', 'eaglemoss_collection', 'startrek', 'startrek-collection', 'ship-collection'];
    
    for (const dbName of possibleDatabases) {
      console.log(`\n=== Checking database: ${dbName} ===`);
      
      try {
        const db = client.db(dbName);
        const possibleCollections = ['starshipv5', 'starships'];
        
        for (const collectionName of possibleCollections) {
          console.log(`\n--- Checking ${dbName}.${collectionName} ---`);
          
          try {
            const starshipsCollection = db.collection(collectionName);
            const count = await starshipsCollection.countDocuments();
            console.log(`Total documents: ${count}`);
            
            if (count > 0) {
              // Find ships missing key fields
              const shipsToUpdate = await starshipsCollection.find({
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
              
              console.log(`Found ${shipsToUpdate.length} ships that need updates`);
              
              if (shipsToUpdate.length > 0) {
                console.log(`\n*** UPDATING DATABASE: ${dbName}.${collectionName} ***`);
                
                let updated = 0;
                
                for (const ship of shipsToUpdate) {
                  console.log(`\nUpdating: ${ship.shipName} (${ship.edition})`);
                  
                  const updateFields = {};
                  
                  // Set editionInternalName if missing
                  if (!ship.editionInternalName || ship.editionInternalName === '' || ship.editionInternalName === null) {
                    const internalName = ship.edition.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    updateFields.editionInternalName = internalName;
                    console.log(`  Setting editionInternalName: ${internalName}`);
                  }
                  
                  // Set collectionType if missing
                  if (!ship.collectionType || ship.collectionType === '' || ship.collectionType === null) {
                    updateFields.collectionType = 'Star Trek';
                    console.log(`  Setting collectionType: Star Trek`);
                  }
                  
                  // Set franchise if missing
                  if (!ship.franchise || ship.franchise === '' || ship.franchise === null) {
                    let franchise = 'Star Trek';
                    if (ship.edition && ship.edition.toLowerCase().includes('discovery')) {
                      franchise = 'Star Trek: Discovery';
                    } else if (ship.shipName && ship.shipName.toLowerCase().includes('discovery')) {
                      franchise = 'Star Trek: Discovery';
                    }
                    updateFields.franchise = franchise;
                    console.log(`  Setting franchise: ${franchise}`);
                  }
                  
                  // Ensure boolean fields are set
                  if (typeof ship.owned !== 'boolean') {
                    updateFields.owned = false;
                  }
                  if (typeof ship.wishlist !== 'boolean') {
                    updateFields.wishlist = false;
                  }
                  if (typeof ship.onOrder !== 'boolean') {
                    updateFields.onOrder = false;
                  }
                  if (typeof ship.wishlistPriority !== 'number') {
                    updateFields.wishlistPriority = 0;
                  }
                  
                  // Ensure array fields exist
                  if (!Array.isArray(ship.conditionPhotos)) {
                    updateFields.conditionPhotos = [];
                  }
                  if (!Array.isArray(ship.sightings)) {
                    updateFields.sightings = [];
                  }
                  
                  if (Object.keys(updateFields).length > 0) {
                    await starshipsCollection.updateOne(
                      { _id: ship._id },
                      { $set: updateFields }
                    );
                    updated++;
                    console.log(`  Updated!`);
                  } else {
                    console.log(`  No updates needed`);
                  }
                }
                
                console.log(`\nUpdated ${updated} ships in ${dbName}.${collectionName}`);
                
                // Check for Discovery ships specifically
                const discoveryCheck = await starshipsCollection.find({
                  $or: [
                    { edition: { $regex: /discovery/i } },
                    { shipName: { $regex: /discovery/i } }
                  ]
                }).toArray();
                
                console.log(`Discovery ships found: ${discoveryCheck.length}`);
              }
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

fixDiscoveryShips(); 