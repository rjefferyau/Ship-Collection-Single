// Script to check for case sensitivity issues with franchises
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  // Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  
  if (!uri || !dbName) {
    console.error('Missing environment variables: MONGODB_URI or MONGODB_DB');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(dbName);
    const starships = database.collection('starshipv5'); // Using the collection name from the model
    
    // Get all unique franchise values
    const franchises = await starships.distinct('franchise');
    console.log(`Found ${franchises.length} unique franchise values:`);
    franchises.forEach(f => console.log(`- "${f}"`));
    
    // Check for case sensitivity issues
    const franchiseLowerCase = {};
    const potentialDuplicates = [];
    
    franchises.forEach(franchise => {
      if (!franchise) return; // Skip null/undefined
      
      const lowerCase = franchise.toLowerCase();
      if (franchiseLowerCase[lowerCase]) {
        potentialDuplicates.push({
          original: franchiseLowerCase[lowerCase],
          duplicate: franchise
        });
      } else {
        franchiseLowerCase[lowerCase] = franchise;
      }
    });
    
    if (potentialDuplicates.length > 0) {
      console.log('\nPotential case sensitivity issues found:');
      potentialDuplicates.forEach(dup => {
        console.log(`- "${dup.original}" and "${dup.duplicate}"`);
      });
    } else {
      console.log('\nNo case sensitivity issues found.');
    }
    
    // Check specifically for Battlestar Galactica
    const bsgVariations = [
      'Battlestar Galactica',
      'battlestar galactica',
      'Battlestar galactica',
      'battlestar Galactica'
    ];
    
    console.log('\nChecking for specific Battlestar Galactica variations:');
    
    for (const variation of bsgVariations) {
      const count = await starships.countDocuments({ franchise: variation });
      console.log(`- "${variation}": ${count} ships`);
    }
    
    // Check for partial matches
    console.log('\nChecking for partial matches:');
    const partialMatches = await starships.find({
      franchise: { $regex: 'battlestar', $options: 'i' }
    }).toArray();
    
    console.log(`Found ${partialMatches.length} ships with 'battlestar' in the franchise name:`);
    partialMatches.forEach(ship => {
      console.log(`- ${ship.shipName} (${ship.issue}), Franchise: "${ship.franchise}"`);
    });
    
    // Check collection types
    const collectionTypes = await starships.distinct('collectionType');
    console.log('\nCollection types:');
    collectionTypes.forEach(type => console.log(`- "${type}"`));
    
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error); 