require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = 'ship-collection-v2';
  
  if (!uri) {
    console.error('Missing MONGODB_URI environment variable');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(dbName);
    
    // Get all editions
    const editions = await database.collection('editions').find({}).toArray();
    
    console.log(`\nFound ${editions.length} editions total`);
    
    // Group editions by franchise
    const editionsByFranchise = editions.reduce((acc, edition) => {
      const franchise = edition.franchise || 'Unknown';
      if (!acc[franchise]) {
        acc[franchise] = [];
      }
      acc[franchise].push(edition);
      return acc;
    }, {});
    
    // Log editions by franchise
    for (const [franchise, franchiseEditions] of Object.entries(editionsByFranchise)) {
      console.log(`\n${franchise} Editions (${franchiseEditions.length}):`);
      
      franchiseEditions.forEach(edition => {
        const idType = edition._id instanceof ObjectId ? 'ObjectId' : typeof edition._id;
        const idString = edition._id.toString();
        const isValidObjectId = ObjectId.isValid(idString);
        
        console.log(
          `- ID: ${idString} (${idType})` +
          ` | Valid ObjectId: ${isValidObjectId ? 'Yes' : 'No'}` +
          ` | Name: "${edition.name}"` +
          ` | Internal: "${edition.internalName || 'N/A'}"` +
          ` | Default: ${edition.isDefault ? 'Yes' : 'No'}`
        );
      });
    }
    
    // Specifically check and report Star Trek edition with problems
    console.log('\nTesting problematic Star Trek edition lookups:');
    
    const starTrekEditions = editions.filter(e => e.franchise === 'Star Trek');
    
    for (const edition of starTrekEditions) {
      console.log(`\nTesting lookup for: ${edition.name} (ID: ${edition._id})`);
      
      // Test direct lookup by ID string 
      const byIdString = await database.collection('editions').findOne({ _id: edition._id });
      console.log(`- Lookup by _id object directly: ${byIdString ? 'Found' : 'Not found'}`);
      
      // Test lookup by creating new ObjectId from string
      try {
        const idString = edition._id.toString();
        const byObjectId = await database.collection('editions').findOne({ _id: new ObjectId(idString) });
        console.log(`- Lookup by new ObjectId from string: ${byObjectId ? 'Found' : 'Not found'}`);
      } catch (error) {
        console.log(`- Lookup by new ObjectId from string: Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

main().catch(console.error);
