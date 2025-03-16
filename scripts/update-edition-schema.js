// Script to update the database schema by removing the unique index on the name field
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

// Main function
async function updateEditionSchema() {
  try {
    await connectToDatabase();
    
    // Get the editions collection
    const db = mongoose.connection.db;
    const editionsCollection = db.collection('editions');
    
    // List all indexes
    console.log('Current indexes:');
    const indexes = await editionsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    
    // Drop the unique index on name if it exists
    const nameIndex = indexes.find(index => 
      index.key && index.key.name === 1 && index.unique === true
    );
    
    if (nameIndex) {
      console.log('Found unique index on name field, dropping it...');
      await editionsCollection.dropIndex('name_1');
      console.log('Successfully dropped the unique index on name field');
    } else {
      console.log('No unique index on name field found');
    }
    
    // Create a compound index on name and franchise if it doesn't exist
    const compoundIndex = indexes.find(index => 
      index.key && index.key.name === 1 && index.key.franchise === 1
    );
    
    if (!compoundIndex) {
      console.log('Creating compound index on name and franchise...');
      await editionsCollection.createIndex(
        { name: 1, franchise: 1 },
        { unique: true }
      );
      console.log('Successfully created compound index on name and franchise');
    } else {
      console.log('Compound index on name and franchise already exists');
    }
    
    // Create a unique index on internalName if it doesn't exist
    const internalNameIndex = indexes.find(index => 
      index.key && index.key.internalName === 1
    );
    
    if (!internalNameIndex) {
      console.log('Creating unique index on internalName...');
      await editionsCollection.createIndex(
        { internalName: 1 },
        { unique: true }
      );
      console.log('Successfully created unique index on internalName');
    } else {
      console.log('Index on internalName already exists');
    }
    
    // List updated indexes
    console.log('\nUpdated indexes:');
    const updatedIndexes = await editionsCollection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));
    
    console.log('\nSchema update complete');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
updateEditionSchema(); 