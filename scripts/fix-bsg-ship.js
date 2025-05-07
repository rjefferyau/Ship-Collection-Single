const mongoose = require('mongoose');

// Hard-coded MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/ship-collection-v2';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect:', error.message);
    return false;
  }
}

// Define models for direct access
const EditionSchema = new mongoose.Schema({}, { strict: false });
const StarshipSchema = new mongoose.Schema({}, { strict: false });

// Create models
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema, 'starshipv5');

// Function to fix the BSG ship issue
async function fixBsgShip() {
  try {
    console.log('\n=== FIXING BATTLESTAR GALACTICA SHIP ISSUE ===\n');
    
    // 1. Find the problematic ship
    const problemShip = await Starship.findOne({ edition: 'regular-battlestar-galactica' });
    
    if (!problemShip) {
      console.log('No ship found with edition "regular-battlestar-galactica"');
      return false;
    }
    
    console.log(`Found problem ship: ${problemShip.shipName} (Issue: ${problemShip.issue})`);
    
    // 2. Find the correct edition to link to (Regular with franchise Battlestar Galactica)
    const correctEdition = await Edition.findOne({ 
      name: 'Regular', 
      franchise: 'Battlestar Galactica' 
    });
    
    if (!correctEdition) {
      console.log('Could not find the correct "Regular" edition for Battlestar Galactica');
      
      // Show available editions
      console.log('\nAvailable editions:');
      const editions = await Edition.find({});
      editions.forEach(e => {
        console.log(`- ${e.name} (${e.franchise}) [ID: ${e._id}]`);
      });
      
      return false;
    }
    
    console.log(`Found correct edition: ${correctEdition.name} (${correctEdition.franchise})`);
    console.log(`Edition ID: ${correctEdition._id}`);
    console.log(`Internal name: ${correctEdition.internalName}`);
    
    // 3. Update the ship
    const updateResult = await Starship.updateOne(
      { _id: problemShip._id },
      { 
        $set: { 
          edition: 'Regular', // Fix the edition name
          editionInternalName: correctEdition.internalName,
          editionObjectId: correctEdition._id,
          franchise: 'Battlestar Galactica'
        } 
      }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log(`\n✓ Successfully updated the ship!`);
      
      // Verify the update
      const updatedShip = await Starship.findById(problemShip._id);
      console.log('\nUpdated ship details:');
      console.log(`- Name: ${updatedShip.shipName}`);
      console.log(`- Issue: ${updatedShip.issue}`);
      console.log(`- Edition: ${updatedShip.edition}`);
      console.log(`- Edition Internal Name: ${updatedShip.editionInternalName}`);
      console.log(`- Franchise: ${updatedShip.franchise}`);
      
      return true;
    } else {
      console.log(`\n× Failed to update the ship. No changes were made.`);
      return false;
    }
  } catch (error) {
    console.error('Error fixing BSG ship:', error);
    return false;
  }
}

// Function to clean up duplicate edition
async function cleanupDuplicateEdition() {
  try {
    console.log('\n=== CHECKING FOR DUPLICATE EDITIONS ===\n');
    
    // Find the problematic edition named "regular-battlestar-galactica"
    const badEdition = await Edition.findOne({ 
      name: 'regular-battlestar-galactica' 
    });
    
    if (!badEdition) {
      console.log('No problematic edition with name "regular-battlestar-galactica" found');
      return;
    }
    
    // Check if any ships still reference this edition
    const referencingShips = await Starship.countDocuments({ 
      $or: [
        { edition: 'regular-battlestar-galactica' },
        { editionObjectId: badEdition._id }
      ]
    });
    
    if (referencingShips > 0) {
      console.log(`Found ${referencingShips} ships still referencing the problematic edition`);
      console.log('Not deleting the edition to avoid breaking these ships');
      return;
    }
    
    // Delete the problematic edition since no ships reference it
    const deleteResult = await Edition.deleteOne({ _id: badEdition._id });
    
    if (deleteResult.deletedCount === 1) {
      console.log(`✓ Successfully deleted the problematic edition "regular-battlestar-galactica"`);
    } else {
      console.log(`× Failed to delete the problematic edition`);
    }
  } catch (error) {
    console.error('Error cleaning up duplicate edition:', error);
  }
}

// Main function
async function main() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Exiting due to connection failure');
    process.exit(1);
  }
  
  try {
    // Fix the BSG ship issue
    const shipFixed = await fixBsgShip();
    
    // If ship was fixed successfully, try to clean up the duplicate edition
    if (shipFixed) {
      await cleanupDuplicateEdition();
    }
    
    console.log('\nRepair process complete! Refresh your browser page to see the changes.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
main(); 