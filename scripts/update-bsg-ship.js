// Script to update the Battlestar Galactica ship with a proper collection type
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
    const starships = database.collection('starshipv5');
    
    // Find the Battlestar Galactica ship
    const bsgShip = await starships.findOne({
      franchise: { $regex: 'battlestar', $options: 'i' }
    });
    
    if (bsgShip) {
      console.log('Found Battlestar Galactica ship:');
      console.log(`- ${bsgShip.shipName} (${bsgShip.issue}), Franchise: "${bsgShip.franchise}", Collection Type: "${bsgShip.collectionType}"`);
      
      // Update the ship with a proper collection type
      const result = await starships.updateOne(
        { _id: bsgShip._id },
        { $set: { collectionType: 'Diecast Model' } }
      );
      
      console.log(`Updated ${result.modifiedCount} ship(s)`);
      
      // Verify the update
      const updatedShip = await starships.findOne({ _id: bsgShip._id });
      console.log('\nUpdated ship:');
      console.log(`- ${updatedShip.shipName} (${updatedShip.issue}), Franchise: "${updatedShip.franchise}", Collection Type: "${updatedShip.collectionType}"`);
    } else {
      console.log('No Battlestar Galactica ships found');
    }
    
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error); 