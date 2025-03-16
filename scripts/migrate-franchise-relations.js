const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

// Define the Edition schema
const EditionSchema = new mongoose.Schema({
  name: String,
  description: String,
  retailPrice: Number,
  franchise: { type: String, default: 'Star Trek' }
}, {
  timestamps: true
});

// Define the Faction schema
const FactionSchema = new mongoose.Schema({
  name: String,
  description: String,
  franchise: { type: String, default: 'Star Trek' }
}, {
  timestamps: true
});

// Create the models
const Edition = mongoose.model('Edition', EditionSchema);
const Faction = mongoose.model('Faction', FactionSchema);

async function migrateFranchiseRelations() {
  try {
    await connectToDatabase();
    
    // Update all existing editions to have the default franchise
    const editionResult = await Edition.updateMany(
      { franchise: { $exists: false } },
      { $set: { franchise: 'Star Trek' } }
    );
    
    console.log(`Updated ${editionResult.modifiedCount} editions with default franchise`);
    
    // Update all existing factions to have the default franchise
    const factionResult = await Faction.updateMany(
      { franchise: { $exists: false } },
      { $set: { franchise: 'Star Trek' } }
    );
    
    console.log(`Updated ${factionResult.modifiedCount} factions with default franchise`);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateFranchiseRelations(); 