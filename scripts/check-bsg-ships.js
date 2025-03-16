// Script to check for Battlestar Galactica ships in the database
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(process.env.MONGODB_DB);
    const starships = database.collection('starships');
    
    // Find all ships with Battlestar Galactica franchise
    const bsgShips = await starships.find({ franchise: 'Battlestar Galactica' }).toArray();
    console.log(`Found ${bsgShips.length} Battlestar Galactica ships:`);
    
    if (bsgShips.length > 0) {
      bsgShips.forEach(ship => {
        console.log(`- ${ship.shipName} (${ship.issue}), Collection Type: ${ship.collectionType}`);
      });
    }
    
    // Check if there are any ships with similar but not exact franchise name
    const similarShips = await starships.find({ 
      franchise: { $regex: 'battlestar', $options: 'i' } 
    }).toArray();
    
    if (similarShips.length > bsgShips.length) {
      console.log('\nFound ships with similar franchise names:');
      similarShips.forEach(ship => {
        if (!bsgShips.some(b => b._id.toString() === ship._id.toString())) {
          console.log(`- ${ship.shipName} (${ship.issue}), Franchise: "${ship.franchise}", Collection Type: ${ship.collectionType}`);
        }
      });
    }
    
    // Check all unique franchise values
    const franchises = await starships.distinct('franchise');
    console.log('\nAll franchise values in the database:');
    franchises.forEach(f => console.log(`- "${f}"`));
    
  } finally {
    await client.close();
  }
}

main().catch(console.error); 