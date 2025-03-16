// Test script for manufacturer diagnostics and fixes
const fetch = require('node-fetch');

async function runDiagnostics() {
  try {
    console.log('='.repeat(50));
    console.log('Running manufacturer diagnostics...');
    console.log('='.repeat(50));
    
    const response = await fetch('http://localhost:3000/api/starships/check-manufacturer-status');
    
    if (!response.ok) {
      throw new Error('Failed to run manufacturer diagnostics');
    }
    
    const data = await response.json();
    
    console.log('\nDiagnostic Results:');
    console.log('- Total Starships:', data.stats.total);
    console.log('- With Manufacturer:', data.stats.withManufacturer);
    console.log('- Without Manufacturer:', data.stats.withoutManufacturer);
    console.log('- With Franchise:', data.stats.withFranchise);
    console.log('- Without Franchise:', data.stats.withoutFranchise);
    console.log('- Franchise Has Manufacturer:', data.stats.franchiseHasManufacturer);
    console.log('- Franchise No Manufacturer:', data.stats.franchiseNoManufacturer);
    
    console.log('\nSample Starships:');
    data.stats.sampleStarships.forEach((ship, index) => {
      console.log(`\nShip ${index + 1}:`);
      console.log(`- ID: ${ship.id}`);
      console.log(`- Issue: ${ship.issue}`);
      console.log(`- Edition: ${ship.edition}`);
      console.log(`- Ship Name: ${ship.shipName}`);
      console.log(`- Franchise: ${ship.franchise}`);
      console.log(`- Manufacturer: ${ship.manufacturer}`);
      console.log(`- Edition Internal Name: ${ship.editionInternalName}`);
    });
    
    console.log('\nManufacturers:');
    data.manufacturers.forEach((manufacturer, index) => {
      console.log(`\nManufacturer ${index + 1}: ${manufacturer.name}`);
      console.log('Franchises:');
      if (manufacturer.franchises.length > 0) {
        manufacturer.franchises.forEach(franchise => {
          console.log(`- ${franchise}`);
        });
      } else {
        console.log('- No franchises assigned');
      }
    });
    
    return data;
  } catch (err) {
    console.error('\nERROR:', err.message);
    if (err.stack) {
      console.error('\nStack trace:');
      console.error(err.stack);
    }
  }
}

async function forceUpdateManufacturers(franchise, manufacturerName, forceUpdate = true) {
  try {
    console.log('='.repeat(50));
    console.log(`Force updating manufacturers for franchise: "${franchise}"`);
    console.log(`Setting manufacturer to: "${manufacturerName}"`);
    console.log(`Force update all: ${forceUpdate}`);
    console.log('='.repeat(50));
    
    const requestBody = {
      franchise,
      manufacturerName,
      forceUpdate
    };
    
    console.log('\nRequest body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3000/api/starships/force-update-manufacturers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('\nResponse received:');
    console.log('Status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update manufacturers');
    }
    
    console.log('\nSuccess:', data.message);
    
    if (data.stats) {
      console.log('\nStats:');
      console.log(`- Total found: ${data.stats.total}`);
      console.log(`- Updated: ${data.stats.updated}`);
      console.log(`- Errors: ${data.stats.errors}`);
      
      if (data.stats.affectedShips && data.stats.affectedShips.length > 0) {
        console.log('\nUpdated ships:');
        data.stats.affectedShips.forEach(ship => {
          console.log(`- ${ship.name} (${ship.id})`);
        });
      }
    }
    
    return data;
  } catch (err) {
    console.error('\nERROR:', err.message);
    if (err.stack) {
      console.error('\nStack trace:');
      console.error(err.stack);
    }
  }
}

// Get parameters from command line
const args = process.argv.slice(2);
const command = args[0] || 'diagnostics';
const franchise = args[1] || 'Star Trek';
const manufacturerName = args[2] || 'Eaglemoss';
const forceUpdate = args[3] !== 'false';

console.log('\nStarting with parameters:');
console.log('- Command:', command);
console.log('- Franchise:', franchise);
console.log('- Manufacturer Name:', manufacturerName);
console.log('- Force Update:', forceUpdate);

// Run the appropriate command
async function main() {
  if (command === 'diagnostics') {
    await runDiagnostics();
  } else if (command === 'update') {
    await forceUpdateManufacturers(franchise, manufacturerName, forceUpdate);
    // Run diagnostics after update to see the changes
    console.log('\nRunning diagnostics after update...');
    await runDiagnostics();
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('\nUsage:');
    console.log('  node scripts/test-manufacturer-diagnostics.js [command] [franchise] [manufacturerName] [forceUpdate]');
    console.log('\nCommands:');
    console.log('  diagnostics - Run diagnostics only');
    console.log('  update - Force update manufacturers and then run diagnostics');
  }
}

main()
  .then(() => {
    console.log('\nScript execution completed.');
  })
  .catch(err => {
    console.error('\nUnhandled error in script execution:', err);
  });

console.log('\nUsage:');
console.log('  node scripts/test-manufacturer-diagnostics.js [command] [franchise] [manufacturerName] [forceUpdate]');
console.log('\nCommands:');
console.log('  diagnostics - Run diagnostics only');
console.log('  update - Force update manufacturers and then run diagnostics');
console.log('\nDefaults:');
console.log('  command: "diagnostics"');
console.log('  franchise: "Star Trek"');
console.log('  manufacturerName: "Eaglemoss"');
console.log('  forceUpdate: true'); 