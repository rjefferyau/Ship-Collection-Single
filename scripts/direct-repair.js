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

// Function to repair editions using direct collection access
async function directRepair() {
  try {
    console.log('\n=== DIRECTLY REPAIRING EDITIONS ===\n');
    
    // Get direct access to the collection
    const db = mongoose.connection.db;
    const editionCollection = db.collection('editions');
    
    // Find all editions
    const editions = await editionCollection.find({}).toArray();
    console.log(`Found ${editions.length} editions to repair\n`);
    
    // Default franchise
    const DEFAULT_FRANCHISE = 'Star Trek';
    let updatedCount = 0;
    
    // Update each edition directly
    for (const edition of editions) {
      try {
        const updates = {};
        
        // Check if franchise is missing
        if (!edition.franchise) {
          updates.franchise = DEFAULT_FRANCHISE;
          console.log(`- Adding franchise "${DEFAULT_FRANCHISE}" to edition "${edition.name}"`);
        }
        
        // Check if internalName is missing
        if (!edition.internalName) {
          const nameSlug = edition.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          const franchiseSlug = (updates.franchise || edition.franchise || DEFAULT_FRANCHISE).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          updates.internalName = `${nameSlug}-${franchiseSlug}`;
          console.log(`- Adding internal name "${updates.internalName}" to edition "${edition.name}"`);
        }
        
        // Direct update if we have changes
        if (Object.keys(updates).length > 0) {
          const result = await editionCollection.updateOne(
            { _id: edition._id },
            { $set: updates }
          );
          
          if (result.modifiedCount === 1) {
            updatedCount++;
            console.log(`  ✓ Updated successfully`);
          } else {
            console.log(`  × No changes made to the document`);
          }
        }
      } catch (error) {
        console.error(`Error updating edition "${edition.name}":`, error.message);
      }
    }
    
    // Final report
    console.log(`\nUpdated ${updatedCount} of ${editions.length} editions`);
    
    // Display updated editions
    const updatedEditions = await editionCollection.find({}).toArray();
    console.log('\n=== EDITIONS AFTER REPAIR ===\n');
    
    updatedEditions.forEach(edition => {
      console.log(`ID: ${edition._id}`);
      console.log(`Name: ${edition.name || 'undefined'}`);
      console.log(`Franchise: ${edition.franchise || 'undefined'}`);
      console.log(`Internal Name: ${edition.internalName || 'undefined'}`);
      console.log('-'.repeat(50));
    });
    
  } catch (error) {
    console.error('Error in direct repair process:', error);
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
    // Repair editions directly
    await directRepair();
    console.log('\nDirect repair complete! Refresh your browser page to see the changes.');
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