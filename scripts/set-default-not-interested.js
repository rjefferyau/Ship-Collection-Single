/**
 * This script updates all starships that are in a neutral state 
 * (not owned, not on wishlist, not on order, and not already marked as not interested)
 * to have notInterested set to true by default.
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';

async function main() {
  console.log('Starting migration to set default notInterested status...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the starshipv5 collection
    const db = mongoose.connection.db;
    const starshipCollection = db.collection('starshipv5');
    
    // Find all starships in neutral state and update them
    const result = await starshipCollection.updateMany(
      { 
        owned: false, 
        wishlist: false, 
        onOrder: false,
        notInterested: { $ne: true } // Don't update ones that are already marked
      },
      { $set: { notInterested: true } }
    );
    
    console.log(`Migration complete. Updated ${result.modifiedCount} starships.`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 