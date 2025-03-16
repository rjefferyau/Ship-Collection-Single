// Simple script to check the database
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = 'ship-collection-v2'; // Hardcoded from the connection string
  
  console.log('MongoDB URI:', uri ? 'Defined' : 'Undefined');
  console.log('MongoDB DB:', dbName);
  
  if (!uri) {
    console.error('Missing environment variables');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(dbName);
    
    // List all collections
    const collections = await database.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    // Check starshipv5 collection
    const starships = database.collection('starshipv5');
    const count = await starships.countDocuments();
    console.log(`\nTotal starships: ${count}`);
    
    // Check for Battlestar Galactica ships
    const bsgRegex = new RegExp('battlestar', 'i');
    const bsgShips = await starships.find({
      franchise: { $regex: bsgRegex }
    }).toArray();
    
    console.log(`\nShips with 'battlestar' in franchise name: ${bsgShips.length}`);
    bsgShips.forEach(ship => {
      console.log(`- ${ship.shipName} (${ship.issue}), Franchise: "${ship.franchise}", Collection Type: "${ship.collectionType}"`);
    });
    
    // Check collectionType field
    const collectionTypes = await starships.distinct('collectionType');
    console.log('\nCollection types:');
    collectionTypes.forEach(type => console.log(`- "${type}"`));
    
    // Check franchise field
    const franchises = await starships.distinct('franchise');
    console.log('\nFranchises:');
    franchises.forEach(f => console.log(`- "${f}"`));
    
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error); 