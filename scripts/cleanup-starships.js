// Usage: node scripts/cleanup-starships.js
const path = require('path');
const Starship = require(path.join(__dirname, '../models/Starship')).default;
const Edition = require(path.join(__dirname, '../models/Edition')).default;
const dbConnect = require(path.join(__dirname, '../lib/mongodb')).default;

async function cleanupStarships() {
  console.log('Starting starship cleanup...');
  await dbConnect();
  
  const starships = await Starship.find({});
  console.log(`Found ${starships.length} starships to check`);
  
  let updated = 0;
  let checked = 0;

  for (const ship of starships) {
    checked++;
    let needsUpdate = false;
    let updateFields = {};

    console.log(`\nChecking ship ${checked}/${starships.length}: ${ship.shipName} (${ship.edition})`);
    
    // Get edition details if needed
    let editionDetails = {};
    if (!ship.editionInternalName || !ship.collectionType || !ship.franchise) {
      console.log(`  Looking up edition: "${ship.edition}"`);
      const edition = await Edition.findOne({ name: ship.edition });
      if (edition) {
        console.log(`  Found edition: ${edition.name} -> ${edition.internalName}`);
        editionDetails = {
          editionInternalName: edition.internalName,
          collectionType: edition.collectionType || '',
          franchise: edition.franchise || ''
        };
      } else {
        console.log(`  No edition found for "${ship.edition}", using fallbacks`);
        // Generate fallback editionInternalName
        const fallbackInternalName = ship.edition.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        editionDetails = {
          editionInternalName: fallbackInternalName,
          collectionType: 'Star Trek', // Default fallback
          franchise: ship.edition.includes('Discovery') ? 'Star Trek: Discovery' : 'Star Trek' // Smart fallback
        };
      }
    }

    // Fill missing fields (treat empty strings as missing)
    if (!ship.editionInternalName || ship.editionInternalName === '') {
      updateFields.editionInternalName = editionDetails.editionInternalName;
      needsUpdate = true;
      console.log(`  Setting editionInternalName: ${editionDetails.editionInternalName}`);
    }
    if (!ship.collectionType || ship.collectionType === '') {
      updateFields.collectionType = editionDetails.collectionType;
      needsUpdate = true;
      console.log(`  Setting collectionType: ${editionDetails.collectionType}`);
    }
    if (!ship.franchise || ship.franchise === '') {
      updateFields.franchise = editionDetails.franchise;
      needsUpdate = true;
      console.log(`  Setting franchise: ${editionDetails.franchise}`);
    }
    if (typeof ship.owned !== 'boolean') {
      updateFields.owned = false;
      needsUpdate = true;
      console.log(`  Setting owned: false`);
    }
    if (typeof ship.wishlist !== 'boolean') {
      updateFields.wishlist = false;
      needsUpdate = true;
      console.log(`  Setting wishlist: false`);
    }
    if (typeof ship.onOrder !== 'boolean') {
      updateFields.onOrder = false;
      needsUpdate = true;
      console.log(`  Setting onOrder: false`);
    }
    if (typeof ship.wishlistPriority !== 'number') {
      updateFields.wishlistPriority = 0;
      needsUpdate = true;
      console.log(`  Setting wishlistPriority: 0`);
    }
    if (!Array.isArray(ship.conditionPhotos)) {
      updateFields.conditionPhotos = [];
      needsUpdate = true;
      console.log(`  Setting conditionPhotos: []`);
    }
    if (!Array.isArray(ship.sightings)) {
      updateFields.sightings = [];
      needsUpdate = true;
      console.log(`  Setting sightings: []`);
    }

    if (needsUpdate) {
      console.log(`  -> UPDATING ship ${ship._id}`);
      await Starship.updateOne({ _id: ship._id }, { $set: updateFields });
      updated++;
    } else {
      console.log(`  -> No updates needed`);
    }
  }

  console.log(`\nCleanup complete. Checked ${checked} starships, updated ${updated} starships.`);
  require('mongoose').connection.close();
}

cleanupStarships().catch(err => {
  console.error('Error during cleanup:', err);
  require('mongoose').connection.close();
}); 