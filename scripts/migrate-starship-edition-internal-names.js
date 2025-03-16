// Migration script to update existing starships with edition internal names
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Define Edition schema
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
    franchise: {
      type: String,
      required: [true, 'Franchise is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Define Starship schema
const StarshipSchema = new mongoose.Schema(
  {
    issue: { type: String, required: true },
    edition: { type: String, required: true },
    editionInternalName: { type: String },
    shipName: { type: String, required: true },
    faction: { type: String, required: true },
    franchise: { type: String }
  },
  {
    timestamps: true
  }
);

// Create the models
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema);

// Main migration function
async function migrateStarshipEditionInternalNames() {
  try {
    await connectToDatabase();
    
    // Get all editions with their internal names
    const editions = await Edition.find({});
    console.log(`Found ${editions.length} editions`);
    
    // Create a map of edition name to internal name and franchise
    const editionMap = new Map();
    editions.forEach(edition => {
      editionMap.set(edition.name, {
        internalName: edition.internalName,
        franchise: edition.franchise
      });
    });
    
    // Get all starships
    const starships = await Starship.find({});
    console.log(`Found ${starships.length} starships to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Update each starship with edition internal name and franchise
    for (const starship of starships) {
      try {
        // Skip if already has an edition internal name
        if (starship.editionInternalName) {
          skippedCount++;
          continue;
        }
        
        // Get the edition info from the map
        const editionInfo = editionMap.get(starship.edition);
        
        if (!editionInfo) {
          console.warn(`No edition found for starship ${starship._id} with edition "${starship.edition}"`);
          errorCount++;
          continue;
        }
        
        // Update the starship
        await Starship.updateOne(
          { _id: starship._id },
          { 
            $set: { 
              editionInternalName: editionInfo.internalName,
              franchise: editionInfo.franchise
            } 
          }
        );
        
        updatedCount++;
        
        // Log progress every 100 starships
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} starships so far...`);
        }
      } catch (error) {
        console.error(`Error updating starship ${starship._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration complete: Updated ${updatedCount} starships, skipped ${skippedCount}, ${errorCount} errors`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateStarshipEditionInternalNames(); 