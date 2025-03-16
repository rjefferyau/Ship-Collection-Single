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

// Define the CollectionType schema
const CollectionTypeSchema = new mongoose.Schema({
  name: String,
  description: String
}, {
  timestamps: true
});

// Define the Franchise schema
const FranchiseSchema = new mongoose.Schema({
  name: String,
  description: String
}, {
  timestamps: true
});

// Create the models
const CollectionType = mongoose.model('CollectionType', CollectionTypeSchema);
const Franchise = mongoose.model('Franchise', FranchiseSchema);

async function migrateInitialData() {
  try {
    await connectToDatabase();
    
    // Initial collection types
    const collectionTypes = [
      {
        name: 'Diecast Model',
        description: 'Scale model vehicles made primarily of metal'
      },
      {
        name: 'Trading Card',
        description: 'Collectible cards featuring characters, scenes, or information'
      },
      {
        name: 'LEGO Set',
        description: 'Building block sets from LEGO'
      },
      {
        name: 'Action Figure',
        description: 'Poseable figures of characters'
      },
      {
        name: 'Book',
        description: 'Novels, reference books, and other printed materials'
      }
    ];
    
    // Initial franchises
    const franchises = [
      {
        name: 'Star Trek',
        description: 'Science fiction franchise created by Gene Roddenberry'
      },
      {
        name: 'Battlestar Galactica',
        description: 'Science fiction franchise created by Glen A. Larson'
      },
      {
        name: 'Star Wars',
        description: 'Space opera franchise created by George Lucas'
      },
      {
        name: 'Marvel',
        description: 'Comic book and media franchise by Marvel Entertainment'
      },
      {
        name: 'DC',
        description: 'Comic book and media franchise by DC Entertainment'
      }
    ];
    
    // Insert collection types
    for (const type of collectionTypes) {
      await CollectionType.findOneAndUpdate(
        { name: type.name },
        type,
        { upsert: true, new: true }
      );
    }
    
    console.log(`Added/updated ${collectionTypes.length} collection types`);
    
    // Insert franchises
    for (const franchise of franchises) {
      await Franchise.findOneAndUpdate(
        { name: franchise.name },
        franchise,
        { upsert: true, new: true }
      );
    }
    
    console.log(`Added/updated ${franchises.length} franchises`);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateInitialData(); 