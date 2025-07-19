// Check the _id structure in the database
const { MongoClient, ObjectId } = require('mongodb');

async function checkIdStructure() {
  const uri = 'mongodb://localhost:27017/ship-collection-v2';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('ship-collection-v2');
    const collection = db.collection('starshipv5');
    
    // Get a sample document
    const sample = await collection.findOne();
    console.log('\n=== Sample Document ===');
    console.log('_id value:', sample._id);
    console.log('_id type:', typeof sample._id);
    console.log('_id constructor:', sample._id.constructor.name);
    console.log('_id toString():', sample._id.toString());
    
    // Test the specific ID we were having trouble with
    const testId = '681578437a8c148f4679845a';
    console.log('\n=== Testing ID:', testId, '===');
    
    // Try finding by string
    const byString = await collection.findOne({ _id: testId });
    console.log('Found by string:', !!byString);
    if (byString) {
      console.log('  shipName:', byString.shipName);
    }
    
    // Try finding by ObjectId
    try {
      const byObjectId = await collection.findOne({ _id: new ObjectId(testId) });
      console.log('Found by ObjectId:', !!byObjectId);
      if (byObjectId) {
        console.log('  shipName:', byObjectId.shipName);
      }
    } catch (e) {
      console.log('Error with ObjectId:', e.message);
    }
    
    // Get all _id types in collection (sample)
    const sampleDocs = await collection.find({}).limit(5).toArray();
    console.log('\n=== Sample _id types ===');
    sampleDocs.forEach((doc, i) => {
      console.log(`Doc ${i+1}: ${doc._id} (${typeof doc._id}, ${doc._id.constructor.name})`);
    });
    
    // Find a ship without image for testing
    const noImageShip = await collection.findOne({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: "" }
      ]
    });
    
    if (noImageShip) {
      console.log('\n=== Ship without image for testing ===');
      console.log('_id:', noImageShip._id);
      console.log('_id type:', typeof noImageShip._id);
      console.log('shipName:', noImageShip.shipName);
      console.log('edition:', noImageShip.edition);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkIdStructure();