// Migration script to update all existing starships with default franchise and collection type
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Define the Starship schema
const starshipSchema = new mongoose.Schema({
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

// Update all starships
async function updateStarships() {
  try {
    await connectToDatabase();
    
    // Get the model
    const Starship = mongoose.model('StarshipV5', starshipSchema);
    
    // Update all starships that don't have franchise or collectionType set
    const result = await Starship.updateMany(
      { 
        $or: [
          { franchise: { $exists: false } },
          { franchise: null },
          { franchise: '' },
          { collectionType: { $exists: false } },
          { collectionType: null },
          { collectionType: '' }
        ]
      },
      { 
        $set: { 
          franchise: 'Star Trek',
          collectionType: 'Diecast Model'
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} starships with default values`);
    
    // Verify the update
    const totalCount = await Starship.countDocuments();
    const updatedCount = await Starship.countDocuments({ 
      franchise: 'Star Trek',
      collectionType: 'Diecast Model'
    });
    
    console.log(`Total starships: ${totalCount}`);
    console.log(`Starships with correct values: ${updatedCount}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error updating starships:', error);
    process.exit(1);
  }
}

// Run the update
updateStarships(); 