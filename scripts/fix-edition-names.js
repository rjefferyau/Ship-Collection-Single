// Test script for fix-edition-internal-name API
const fetch = require('node-fetch');

async function fixEditionNames(franchise, incorrectName, correctName) {
  try {
    console.log('='.repeat(50));
    console.log(`Fixing edition internal names for franchise: "${franchise}"`);
    console.log(`Changing from "${incorrectName}" to "${correctName}"`);
    console.log('='.repeat(50));
    console.log('\nSending request to API...');
    
    const requestBody = {
      franchise,
      incorrectEditionInternalName: incorrectName,
      correctEditionInternalName: correctName
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3000/api/starships/fix-edition-internal-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('\nResponse received:');
    console.log('Status:', response.status);
    console.log('Status text:', response.statusText);
    
    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fix edition internal names');
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
const franchise = args[0] || 'Star Trek';
const incorrectName = args[1] || 'regular-battlestar-galactica';
const correctName = args[2] || 'regular-star-trek';

console.log('\nStarting fix with parameters:');
console.log('- Franchise:', franchise);
console.log('- Incorrect name:', incorrectName);
console.log('- Correct name:', correctName);

// Run the fix
fixEditionNames(franchise, incorrectName, correctName)
  .then(() => {
    console.log('\nScript execution completed.');
  })
  .catch(err => {
    console.error('\nUnhandled error in script execution:', err);
  });

console.log('\nUsage:');
console.log('  node scripts/fix-edition-names.js [franchise] [incorrectName] [correctName]');
console.log('\nDefaults:');
console.log('  franchise: "Star Trek"');
console.log('  incorrectName: "regular-battlestar-galactica"');
console.log('  correctName: "regular-star-trek"'); 