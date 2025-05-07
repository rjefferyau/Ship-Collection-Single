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

// Simple schema definitions
const EditionSchema = new mongoose.Schema({
  name: String,
  internalName: String,
  franchise: String
}, { timestamps: true, strict: false });

const StarshipSchema = new mongoose.Schema({
  issue: String,
  edition: String,
  editionInternalName: String,
  editionObjectId: mongoose.Schema.Types.ObjectId,
  shipName: String,
  franchise: String
}, { timestamps: true, strict: false });

// Create models
const Edition = mongoose.models.Edition || mongoose.model('Edition', EditionSchema);
const Starship = mongoose.models.Starship || mongoose.model('Starship', StarshipSchema, 'starshipv5');

// Function to fix ship-edition relationships
async function fixShipEditions() {
  try {
    console.log('\n=== FIXING SHIP-EDITION RELATIONSHIPS ===\n');
    
    // 1. Get all editions with their internal names
    const editions = await Edition.find({}).sort({ name: 1 });
    console.log(`Found ${editions.length} editions\n`);
    
    // Create lookup maps for fast reference
    const editionMap = {};
    editions.forEach(edition => {
      if (edition.name && edition.internalName) {
        editionMap[edition.name] = {
          id: edition._id,
          internalName: edition.internalName,
          franchise: edition.franchise
        };
      }
    });
    
    // 2. Count ships
    const totalShips = await Starship.countDocuments({});
    console.log(`Found ${totalShips} ships to process\n`);
    
    // 3. Process ships in batches to avoid memory issues
    const batchSize = 100;
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let matchNotFoundCount = 0;
    
    // Process in batches
    for (let skip = 0; skip < totalShips; skip += batchSize) {
      const ships = await Starship.find({}).skip(skip).limit(batchSize);
      
      for (const ship of ships) {
        processedCount++;
        
        try {
          // Check if the ship has an edition name
          if (!ship.edition) {
            console.log(`Ship ${ship.shipName} (${ship.issue}) has no edition field`);
            continue;
          }
          
          // Look up the edition
          const editionInfo = editionMap[ship.edition];
          
          if (!editionInfo) {
            matchNotFoundCount++;
            if (matchNotFoundCount <= 10) { // Only show first 10 to avoid spam
              console.log(`No matching edition found for "${ship.edition}" (Ship: ${ship.shipName}, Issue: ${ship.issue})`);
            } else if (matchNotFoundCount === 11) {
              console.log(`Additional missing editions omitted...`);
            }
            continue;
          }
          
          // Check if update is needed
          const needsUpdate = 
            ship.editionInternalName !== editionInfo.internalName || 
            !ship.editionObjectId || 
            ship.editionObjectId.toString() !== editionInfo.id.toString();
          
          if (needsUpdate) {
            // Update the ship
            await Starship.updateOne(
              { _id: ship._id },
              { 
                $set: { 
                  editionInternalName: editionInfo.internalName,
                  editionObjectId: editionInfo.id,
                  // Also update franchise if ship doesn't have one
                  ...(!ship.franchise && editionInfo.franchise ? { franchise: editionInfo.franchise } : {})
                } 
              }
            );
            updatedCount++;
            
            if (updatedCount % 50 === 0) {
              console.log(`Progress: ${processedCount}/${totalShips} ships processed, ${updatedCount} updated`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`Error updating ship ${ship.shipName || 'Unknown'} (${ship.issue || 'Unknown'}):`, error.message);
        }
      }
    }
    
    // 4. Summary
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total ships processed: ${processedCount}`);
    console.log(`Ships updated: ${updatedCount}`);
    console.log(`Edition not found: ${matchNotFoundCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // 5. If there are ships with unknown editions, report them
    if (matchNotFoundCount > 0) {
      console.log(`\n=== EDITIONS NOT IN DATABASE ===`);
      // Get all unique edition names from ships
      const usedEditions = await Starship.distinct('edition');
      // Find which ones don't exist in the editions collection
      const missingEditions = usedEditions.filter(name => 
        name && !editions.some(e => e.name === name)
      );
      
      if (missingEditions.length > 0) {
        console.log(`Found ${missingEditions.length} edition names in ships that don't exist in the editions collection:`);
        missingEditions.forEach((name, i) => {
          if (i < 20) { // Limit to first 20
            console.log(`- "${name}"`);
          } else if (i === 20) {
            console.log(`- ... and ${missingEditions.length - 20} more`);
          }
        });
        
        console.log(`\nYou may want to create these missing editions by running:`);
        console.log(`npm run simple-fix`);
      }
    }
    
    return {
      processed: processedCount,
      updated: updatedCount,
      notFound: matchNotFoundCount,
      errors: errorCount
    };
  } catch (error) {
    console.error('Error in ship-edition fix process:', error);
    return null;
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
    // Fix ship-edition relationships
    const results = await fixShipEditions();
    
    if (results) {
      console.log('\nFix complete! Your ships should now be properly linked to editions.');
      console.log('Refresh your browser page to see the changes.');
      
      if (results.notFound > 0) {
        console.log('\nNOTE: Some ships reference editions that don\'t exist in your database.');
        console.log('You may need to create these editions or update the ships to use existing editions.');
      }
    }
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