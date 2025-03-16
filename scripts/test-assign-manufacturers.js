// Test script for assign-default-manufacturers API
const fetch = require('node-fetch');

async function testAssignManufacturers(overwriteExisting = false) {
  try {
    console.log(`Testing assign-default-manufacturers API (overwriteExisting: ${overwriteExisting})`);
    
    const response = await fetch('http://localhost:3000/api/starships/assign-default-manufacturers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        overwriteExisting
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to assign manufacturers');
    }
    
    console.log('Success:', data.message);
    console.log('Stats:', data.stats);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Run the test
const overwriteExisting = process.argv.includes('--overwrite');
testAssignManufacturers(overwriteExisting);

console.log('\nUsage:');
console.log('  node scripts/test-assign-manufacturers.js         # Only assign to ships without manufacturers');
console.log('  node scripts/test-assign-manufacturers.js --overwrite  # Overwrite existing manufacturers'); 