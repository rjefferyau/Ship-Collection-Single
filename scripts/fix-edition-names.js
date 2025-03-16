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
const EditionSchema = new mongoose.Schema({
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
});

// Define Starship schema
const StarshipSchema = new mongoose.Schema({
  issue: { type: String, required: true },
  edition: { type: String, required: true },
  editionInternalName: { type: String },
  shipName: { type: String, required: true },
  faction: { type: String, required: true },
  franchise: { type: String }
}, {
  collection: 'starshipv5' // Specify the correct collection name
});

// Create models
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema);

async function fixEditionNames() {
  try {
    await connectToDatabase();
    
    // Get all editions
    const editions = await Edition.find({});
    console.log(`Found ${editions.length} editions`);
    
    // Create maps for quick lookups
    const editionByInternalName = new Map();
    const editionByName = new Map();
    editions.forEach(edition => {
      editionByInternalName.set(edition.internalName, edition);
      editionByName.set(edition.name, edition);
    });
    
    // Get all starships
    const starships = await Starship.find({});
    console.log(`Found ${starships.length} starships to check`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Update each starship
    for (const starship of starships) {
      try {
        let needsUpdate = false;
        let updateData = {};
        
        // Case 1: Has editionInternalName but wrong edition name
        if (starship.editionInternalName) {
          const edition = editionByInternalName.get(starship.editionInternalName);
          if (edition && starship.edition !== edition.name) {
            updateData.edition = edition.name;
            needsUpdate = true;
          }
        }
        // Case 2: Has edition name but missing or wrong editionInternalName
        else if (starship.edition) {
          const edition = editionByName.get(starship.edition);
          if (edition) {
            if (!starship.editionInternalName || starship.editionInternalName !== edition.internalName) {
              updateData.editionInternalName = edition.internalName;
              needsUpdate = true;
            }
          }
        }
        
        if (needsUpdate) {
          await Starship.updateOne(
            { _id: starship._id },
            { $set: updateData }
          );
          updatedCount++;
          
          // Log progress every 100 starships
          if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} starships so far...`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error updating starship ${starship._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`
Migration complete:
- Total starships: ${starships.length}
- Updated: ${updatedCount}
- Skipped (already correct): ${skippedCount}
- Errors: ${errorCount}
    `);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
fixEditionNames(); 