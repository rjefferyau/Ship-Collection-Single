const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Define a simple schema for Starship
const StarshipSchema = new mongoose.Schema({}, { strict: false, collection: 'starshipv5' });
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema);

async function checkBattlestarItems() {
  try {
    await connectToMongoDB();
    
    // Find all Battlestar Galactica items
    const battlestarItems = await Starship.find({ franchise: 'Battlestar Galactica' }).lean();
    
    console.log(`Found ${battlestarItems.length} Battlestar Galactica items:`);
    
    // Print details of each item
    battlestarItems.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`ID: ${item._id}`);
      console.log(`Issue: ${item.issue}`);
      console.log(`Ship Name: ${item.shipName}`);
      console.log(`Edition: ${item.edition}`);
      console.log(`Edition Internal Name: ${item.editionInternalName || 'Not set'}`);
      console.log(`Faction: ${item.faction}`);
      console.log(`Franchise: ${item.franchise}`);
      console.log(`Collection Type: ${item.collectionType}`);
      console.log(`Owned: ${item.owned ? 'Yes' : 'No'}`);
    });
    
    // Find all franchises in the database
    const franchises = await Starship.distinct('franchise');
    console.log('\nAll franchises in the database:');
    console.log(franchises);
    
    // Count items by franchise
    console.log('\nCount by franchise:');
    for (const franchise of franchises) {
      if (franchise) {
        const count = await Starship.countDocuments({ franchise });
        console.log(`${franchise}: ${count} items`);
      }
    }
    
  } catch (error) {
    console.error('Error checking Battlestar items:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkBattlestarItems(); 