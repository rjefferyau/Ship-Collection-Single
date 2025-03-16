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

async function fixBattlestarItem() {
  try {
    await connectToMongoDB();
    
    // Find and update the Battlestar Galactica item
    const result = await Starship.findOneAndUpdate(
      { franchise: 'Battlestar Galactica' },
      { 
        $set: { 
          edition: 'Regular',
          editionInternalName: 'regular-battlestar-galactica'
        } 
      },
      { new: true }
    );
    
    if (!result) {
      console.log('No Battlestar Galactica item found');
      return;
    }
    
    console.log('Updated Battlestar Galactica item:');
    console.log(`ID: ${result._id}`);
    console.log(`Issue: ${result.issue}`);
    console.log(`Ship Name: ${result.shipName}`);
    console.log(`Edition: ${result.edition}`);
    console.log(`Edition Internal Name: ${result.editionInternalName || 'Not set'}`);
    console.log(`Faction: ${result.faction}`);
    console.log(`Franchise: ${result.franchise}`);
    
  } catch (error) {
    console.error('Error fixing Battlestar item:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixBattlestarItem(); 