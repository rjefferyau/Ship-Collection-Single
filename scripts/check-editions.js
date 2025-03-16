// Script to check editions in the database
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = 'ship-collection-v2';
  
  if (!uri) {
    console.error('Missing environment variables');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(dbName);
    
    // Get all editions
    const editions = await database.collection('editions').find({}).toArray();
    
    console.log(`Found ${editions.length} editions:`);
    editions.forEach(edition => {
      console.log(`- ID: ${edition._id}, Name: "${edition.name}", Franchise: "${edition.franchise}", Internal Name: "${edition.internalName}", Default: ${edition.isDefault || false}`);
    });
    
    // Get all Star Trek editions
    console.log('\nStar Trek editions:');
    const starTrekEditions = editions.filter(edition => edition.franchise === 'Star Trek');
    starTrekEditions.forEach(edition => {
      console.log(`- ID: ${edition._id}, Name: "${edition.name}", Internal Name: "${edition.internalName}", Default: ${edition.isDefault || false}`);
    });
    
    // Get all Battlestar Galactica editions
    console.log('\nBattlestar Galactica editions:');
    const bsgEditions = editions.filter(edition => edition.franchise === 'Battlestar Galactica');
    bsgEditions.forEach(edition => {
      console.log(`- ID: ${edition._id}, Name: "${edition.name}", Internal Name: "${edition.internalName}", Default: ${edition.isDefault || false}`);
    });
    
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error); 