const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (result.error) {
  console.warn('Warning: .env file not found or cannot be read');
}

// Connect to MongoDB
async function dbConnect() {
  try {
    // Use hardcoded connection string as fallback if environment variable isn't available
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Define Edition model directly in the script for safety
const EditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Edition name is required'],
      trim: true
    },
    internalName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    retailPrice: {
      type: Number
    },
    franchise: {
      type: String,
      required: [true, 'Franchise is required'],
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

EditionSchema.index({ name: 1, franchise: 1 }, { unique: true });
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);

// Define Starship model for reference checks
const StarshipSchema = new mongoose.Schema({}, { strict: false, collection: 'starshipv5' });
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema);

async function listAllEditions() {
  const editions = await Edition.find({});
  console.log('===== Current Editions in Database =====');
  console.log(`Found ${editions.length} editions`);
  
  editions.forEach(edition => {
    console.log(`- ${edition.name} (${edition.franchise}) [ID: ${edition._id}]`);
  });
  console.log('\n');
}

async function findOrphanedStarships() {
  // Get all unique edition names from starships
  const uniqueEditions = await Starship.distinct('edition');
  console.log(`Found ${uniqueEditions.length} unique edition names in starships collection`);
  
  // Find edition names that don't exist in the editions collection
  const existingEditionNames = await Edition.distinct('name');
  const orphanedEditions = uniqueEditions.filter(name => !existingEditionNames.includes(name));
  
  console.log('===== Orphaned Editions =====');
  console.log(`Found ${orphanedEditions.length} edition names in starships that don't have a matching edition record`);
  
  if (orphanedEditions.length > 0) {
    console.log('Editions missing:');
    orphanedEditions.forEach(name => {
      console.log(`- ${name}`);
    });
  }
  
  return orphanedEditions;
}

async function recreateOrphanedEditions() {
  const orphanedEditions = await findOrphanedStarships();
  
  if (orphanedEditions.length === 0) {
    console.log('No orphaned editions to recreate.');
    return;
  }
  
  console.log('\n===== Recreating Orphaned Editions =====');
  let recreatedCount = 0;
  
  for (const editionName of orphanedEditions) {
    // Find a sample starship with this edition to get the franchise
    const sampleStarship = await Starship.findOne({ edition: editionName });
    
    if (!sampleStarship) {
      console.log(`Couldn't find any starships with edition name: ${editionName}`);
      continue;
    }
    
    // Use franchise from starship if available, otherwise use "Unknown"
    const franchise = sampleStarship.franchise || 'Unknown';
    
    // Generate internal name
    const nameSlug = editionName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const franchiseSlug = franchise.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const internalName = `${nameSlug}-${franchiseSlug}`;
    
    try {
      // Create the edition
      await Edition.create({
        name: editionName,
        franchise,
        internalName,
        description: `Auto-recreated after database restore`
      });
      
      console.log(`Recreated: ${editionName} (${franchise})`);
      recreatedCount++;
    } catch (error) {
      console.error(`Error recreating edition ${editionName}:`, error.message);
    }
  }
  
  console.log(`\nRecreated ${recreatedCount} out of ${orphanedEditions.length} missing editions`);
}

async function main() {
  await dbConnect();
  
  // Display current state
  await listAllEditions();
  
  // Find orphaned starships and recreate their editions
  await recreateOrphanedEditions();
  
  // Show final state
  await listAllEditions();
  
  console.log('Script completed');
  mongoose.connection.close();
}

main().catch(error => {
  console.error('Error running script:', error);
  mongoose.connection.close();
}); 