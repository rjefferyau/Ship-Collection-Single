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

// Define models
const EditionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  internalName: { type: String, required: true, unique: true },
  description: String,
  retailPrice: Number,
  franchise: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

// Create model
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);

// Function to repair editions
async function repairEditions() {
  try {
    console.log('\n=== REPAIRING EDITIONS ===\n');
    
    // Get all editions
    const editions = await Edition.find({});
    console.log(`Found ${editions.length} editions to check\n`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Default franchise to use if none is specified
    const DEFAULT_FRANCHISE = 'Star Trek';
    
    // Process each edition
    for (const edition of editions) {
      try {
        let needsUpdate = false;
        let updateData = {};
        
        // Check if franchise is missing
        if (!edition.franchise) {
          updateData.franchise = DEFAULT_FRANCHISE;
          needsUpdate = true;
          console.log(`- Adding franchise "${DEFAULT_FRANCHISE}" to edition "${edition.name}"`);
        }
        
        // Check if internalName is missing
        if (!edition.internalName) {
          // Create a slug from name and franchise
          const nameSlug = edition.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          const franchiseSlug = (updateData.franchise || edition.franchise).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          updateData.internalName = `${nameSlug}-${franchiseSlug}`;
          needsUpdate = true;
          console.log(`- Adding internal name "${updateData.internalName}" to edition "${edition.name}"`);
        }
        
        // Update the edition if needed
        if (needsUpdate) {
          await Edition.updateOne({ _id: edition._id }, { $set: updateData });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error repairing edition "${edition.name}":`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\nRepair summary:`);
    console.log(`- Updated: ${updatedCount} editions`);
    console.log(`- Errors: ${errorCount}`);
    
    // List all editions after repair
    const repairedEditions = await Edition.find({}).sort({ name: 1 });
    
    console.log('\n=== REPAIRED EDITIONS ===\n');
    repairedEditions.forEach(edition => {
      console.log(`ID: ${edition._id}`);
      console.log(`Name: ${edition.name}`);
      console.log(`Franchise: ${edition.franchise}`);
      console.log(`Internal Name: ${edition.internalName}`);
      console.log('-'.repeat(50));
    });
    
  } catch (error) {
    console.error('Error in repair process:', error);
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
    // Repair editions
    await repairEditions();
    console.log('\nRepair complete! Refresh your browser page to see the changes.');
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