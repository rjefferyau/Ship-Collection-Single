/**
 * This script updates the starship schema in the database to set the default value
 * for notInterested to true for any new starships that will be created in the future.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';

async function main() {
  console.log('Starting schema update to set default notInterested value...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Update the schema for the starshipv5 collection
    // Note: MongoDB doesn't have a strict schema like SQL databases, but we can use
    // the $jsonSchema validator to enforce default values for new documents
    
    try {
      // First, try to get existing validators
      const collectionInfo = await db.command({ listCollections: { name: 'starshipv5' }, nameOnly: false });
      const existingOptions = collectionInfo.cursor.firstBatch[0].options || {};
      const existingValidator = existingOptions.validator || {};
      
      console.log('Existing validator:', JSON.stringify(existingValidator, null, 2));
      
      // Create or update the validator to include notInterested default
      const newValidator = {
        $jsonSchema: {
          bsonType: "object",
          required: ["shipName", "issue", "edition"],
          properties: {
            notInterested: {
              bsonType: "bool",
              default: true
            }
          }
        }
      };
      
      // Apply the validator to the collection
      await db.command({
        collMod: 'starshipv5',
        validator: newValidator,
        validationLevel: 'moderate'
      });
      
      console.log('Schema updated successfully');
    } catch (error) {
      console.error('Error updating schema:', error);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error during schema update:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Schema update completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Schema update failed:', err);
    process.exit(1);
  }); 