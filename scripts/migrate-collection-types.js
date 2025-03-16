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

// Define the Starship schema to match our model
const StarshipSchema = new mongoose.Schema({
  issue: String,
  edition: String,
  shipName: String,
  faction: String,
  collectionType: { type: String, default: 'Diecast Model' },
  franchise: { type: String, default: 'Star Trek' },
  releaseDate: Date,
  imageUrl: String,
  magazinePdfUrl: String,
  owned: Boolean,
  wishlist: Boolean,
  wishlistPriority: Number,
  onOrder: Boolean,
  pricePaid: Number,
  orderDate: Date,
  retailPrice: Number,
  purchasePrice: Number,
  marketValue: Number,
  condition: String,
  conditionNotes: String,
  conditionPhotos: [String],
  lastInspectionDate: Date
}, {
  timestamps: true,
  collection: 'starshipv5'
});

// Create the model
const Starship = mongoose.model('StarshipV5', StarshipSchema);

async function migrateCollectionTypes() {
  try {
    await connectToDatabase();
    
    // Update all existing records to have the default collection type and franchise
    const result = await Starship.updateMany(
      { 
        $or: [
          { collectionType: { $exists: false } },
          { franchise: { $exists: false } }
        ]
      },
      { 
        $set: { 
          collectionType: 'Diecast Model',
          franchise: 'Star Trek'
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} records with collection type and franchise`);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCollectionTypes(); 