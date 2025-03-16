require('dotenv').config({ path: './.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  
  console.log('Environment check:');
  if (uri) {
    console.log(`- MONGODB_URI found (${uri.substring(0, 10)}...)`);
  } else {
    console.error('- MONGODB_URI not found in environment variables');
  }
  
  const dbName = 'ship-collection-v2';
  
  if (!uri) {
    console.error('Missing MONGODB_URI environment variable');
    console.error('Make sure your .env.local file contains the MONGODB_URI variable');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(dbName);
    const editionsCollection = database.collection('editions');
    
    // Find all editions
    const editions = await editionsCollection.find({}).toArray();
    console.log(`Found ${editions.length} editions total`);
    
    // Group by franchise
    const editionsByFranchise = editions.reduce((acc, edition) => {
      const franchise = edition.franchise || 'Unknown';
      if (!acc[franchise]) {
        acc[franchise] = [];
      }
      acc[franchise].push(edition);
      return acc;
    }, {});
    
    // Check each edition's ID type
    let stringIdCount = 0;
    let objectIdCount = 0;
    
    console.log('\n=== EDITION ID VALIDATION ===');
    
    for (const [franchise, franchiseEditions] of Object.entries(editionsByFranchise)) {
      console.log(`\n${franchise} Editions:`);
      
      for (const edition of franchiseEditions) {
        const idType = edition._id instanceof ObjectId ? 'ObjectId' : typeof edition._id;
        const idStr = edition._id.toString();
        const validObjectId = ObjectId.isValid(idStr);
        
        if (idType === 'string') {
          stringIdCount++;
          console.log(`❌ String ID: ${edition.name} - ID: ${idStr}`);
        } else {
          objectIdCount++;
          console.log(`✓ ObjectId: ${edition.name} - ID: ${idStr}`);
        }
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Editions: ${editions.length}`);
    console.log(`String IDs: ${stringIdCount}`);
    console.log(`ObjectIds: ${objectIdCount}`);
    
    if (stringIdCount > 0) {
      console.log('\n⚠️  Warning: Some editions still have string IDs. Run the fix-edition-ids.js script to convert them.');
    } else {
      console.log('\n✓ All editions have proper ObjectIds.');
    }
    
  } catch (error) {
    console.error('Error during validation:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

main().catch(console.error); 