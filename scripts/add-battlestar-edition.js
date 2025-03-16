// Script to add a "Regular" edition for "Battlestar Galactica"
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
    description: {
      type: String,
      trim: true
    },
    retailPrice: {
      type: Number,
      default: null
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

// Create a compound index on name and franchise to ensure uniqueness within a franchise
EditionSchema.index({ name: 1, franchise: 1 }, { unique: true });

// Create the model
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);

// Main function
async function addBattlestarEdition() {
  try {
    await connectToDatabase();
    
    // Check if the edition already exists
    const existingEdition = await Edition.findOne({ 
      name: 'Regular', 
      franchise: 'Battlestar Galactica' 
    });
    
    if (existingEdition) {
      console.log('Regular edition for Battlestar Galactica already exists:');
      console.log(`ID: ${existingEdition._id}`);
      console.log(`Name: ${existingEdition.name}`);
      console.log(`Internal Name: ${existingEdition.internalName}`);
      console.log(`Franchise: ${existingEdition.franchise}`);
      return;
    }
    
    // Create the new edition
    const newEdition = new Edition({
      name: 'Regular',
      internalName: 'regular-battlestar-galactica',
      description: 'Regular edition ships from Battlestar Galactica',
      retailPrice: 24.99,
      franchise: 'Battlestar Galactica'
    });
    
    // Save the edition
    await newEdition.save();
    
    console.log('Successfully added Regular edition for Battlestar Galactica:');
    console.log(`ID: ${newEdition._id}`);
    console.log(`Name: ${newEdition.name}`);
    console.log(`Internal Name: ${newEdition.internalName}`);
    console.log(`Franchise: ${newEdition.franchise}`);
    
  } catch (error) {
    console.error('Error adding Battlestar Galactica edition:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addBattlestarEdition(); 