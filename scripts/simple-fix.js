const mongoose = require('mongoose');

// Hard-coded MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/ship-collection-v2';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
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
}, { timestamps: true });

const StarshipSchema = new mongoose.Schema({}, { strict: false });

// Create or get models
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema, 'starshipv5');

// Function to check and fix editions
async function fixEditions() {
  console.log('\n=== CHECKING FOR MISSING EDITIONS ===\n');
  
  // 1. Get all unique edition names from starships
  const editionNames = await Starship.distinct('edition');
  console.log(`Found ${editionNames.length} unique edition names in starships`);
  
  // 2. Get all existing editions
  const existingEditions = await Edition.find({});
  console.log(`Found ${existingEditions.length} editions in database`);
  
  // 3. Find missing editions
  const existingEditionNames = existingEditions.map(e => e.name);
  const missingEditions = editionNames.filter(name => 
    name && !existingEditionNames.includes(name)
  );
  
  console.log(`Found ${missingEditions.length} missing editions`);
  
  if (missingEditions.length === 0) {
    console.log('No missing editions to fix');
    return;
  }
  
  // 4. Create missing editions
  console.log('\n=== RECREATING MISSING EDITIONS ===\n');
  
  for (const editionName of missingEditions) {
    try {
      // Find a starship with this edition to get franchise info
      const sampleShip = await Starship.findOne({ edition: editionName });
      
      if (!sampleShip) {
        console.log(`Couldn't find any starships with edition "${editionName}"`);
        continue;
      }
      
      // Generate internal name from edition name and franchise
      const franchise = sampleShip.franchise || 'Unknown';
      const nameSlug = editionName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const franchiseSlug = franchise.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const internalName = `${nameSlug}-${franchiseSlug}`;
      
      // Create the edition
      const newEdition = new Edition({
        name: editionName,
        internalName: internalName,
        description: 'Auto-recreated after database restore',
        franchise: franchise
      });
      
      await newEdition.save();
      console.log(`✓ Created edition: ${editionName} (${franchise})`);
    } catch (error) {
      console.error(`× Failed to create edition "${editionName}":`, error.message);
    }
  }
  
  // Summary
  const finalEditions = await Edition.find({});
  console.log(`\nFinal result: ${finalEditions.length} editions in database`);
}

// Main function
async function main() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Exiting due to database connection failure');
    process.exit(1);
  }
  
  try {
    // Fix editions
    await fixEditions();
    console.log('\nFix complete! You can now refresh your edition management page.');
  } catch (error) {
    console.error('Error in fix process:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
main(); 