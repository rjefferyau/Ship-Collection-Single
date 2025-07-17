const DatabaseFromBackupCreator = require('./create-database-from-backup');
const path = require('path');

// Example: Create a test database from latest backup
async function createTestDatabase() {
  console.log('🚀 Creating test database from latest backup...\n');
  
  const creator = new DatabaseFromBackupCreator({
    // Use non-interactive mode for this example
    interactive: false,
    
    // Database configuration
    targetUri: 'mongodb://localhost:27017/ship-collection-test',
    databaseId: 'test-db',
    databaseName: 'Test Database',
    description: 'Test database created from backup for development',
    
    // Use latest backup (leave backupPath null to use latest)
    backupPath: null,
    
    // Add to database configuration
    addToConfig: true
  });
  
  try {
    const result = await creator.run();
    console.log('\n🎉 Test database created successfully!');
    console.log(`Database: ${result.database.name}`);
    console.log(`URI: ${result.database.uri}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to create test database:', error.message);
    throw error;
  }
}

// Example: Create production backup database from specific backup
async function createBackupDatabase() {
  console.log('🚀 Creating backup database from specific backup...\n');
  
  const creator = new DatabaseFromBackupCreator({
    interactive: false,
    targetUri: 'mongodb://localhost:27017/ship-collection-backup',
    databaseId: 'backup-db',
    databaseName: 'Backup Database',
    description: 'Production backup database for safe operations',
    // Specify a particular backup file if needed
    // backupPath: path.join(__dirname, '..', 'backups', 'backup-2025-01-15T10-30-00.zip'),
    addToConfig: true
  });
  
  try {
    const result = await creator.run();
    console.log('\n🎉 Backup database created successfully!');
    return result;
  } catch (error) {
    console.error('❌ Failed to create backup database:', error.message);
    throw error;
  }
}

// Run example if this script is executed directly
if (require.main === module) {
  const command = process.argv[2] || 'test';
  
  if (command === 'test') {
    createTestDatabase()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'backup') {
    createBackupDatabase()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage: node example-create-db.js [test|backup]');
    console.log('  test   - Create test database from latest backup');
    console.log('  backup - Create backup database from latest backup');
    process.exit(0);
  }
}

module.exports = { createTestDatabase, createBackupDatabase }; 