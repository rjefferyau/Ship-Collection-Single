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
  name: String,
  internalName: String,
  description: String,
  retailPrice: Number,
  franchise: String,
  isDefault: Boolean
}, { timestamps: true });

// Create model
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);

// List all editions
async function listEditions() {
  try {
    const editions = await Edition.find({}).sort({ name: 1 });
    
    console.log('\n=== ALL EDITIONS ===\n');
    console.log(`Found ${editions.length} editions\n`);
    
    editions.forEach(edition => {
      console.log(`ID: ${edition._id}`);
      console.log(`Name: ${edition.name}`);
      console.log(`Franchise: ${edition.franchise}`);
      console.log(`Internal Name: ${edition.internalName}`);
      console.log('-'.repeat(50));
    });
    
    return editions.length;
  } catch (error) {
    console.error('Error listing editions:', error);
    return 0;
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
    // List editions
    await listEditions();
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