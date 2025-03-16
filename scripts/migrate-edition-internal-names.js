// Migration script to update existing editions with internal names
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

// Function to generate internal name from name and franchise
function generateInternalName(name, franchise) {
  const nameSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const franchiseSlug = franchise.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return `${nameSlug}-${franchiseSlug}`;
}

// Main migration function
async function migrateEditionInternalNames() {
  try {
    await connectToDatabase();
    
    // Get all editions without internal names
    const editions = await mongoose.connection.collection('editions').find({}).toArray();
    console.log(`Found ${editions.length} editions to check`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Update each edition with an internal name
    for (const edition of editions) {
      try {
        // Skip if already has an internal name
        if (edition.internalName) {
          console.log(`Edition ${edition.name} already has internal name: ${edition.internalName}`);
          continue;
        }
        
        // Generate internal name
        const internalName = generateInternalName(edition.name, edition.franchise);
        
        // Update the edition directly in the collection
        const result = await mongoose.connection.collection('editions').updateOne(
          { _id: edition._id },
          { $set: { internalName } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Updated edition ${edition.name} (${edition.franchise}) with internal name: ${internalName}`);
          updatedCount++;
        } else {
          console.log(`No update needed for ${edition.name} (${edition.franchise})`);
        }
      } catch (error) {
        console.error(`Error updating edition ${edition.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration complete: Updated ${updatedCount} editions, ${errorCount} errors`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateEditionInternalNames(); 