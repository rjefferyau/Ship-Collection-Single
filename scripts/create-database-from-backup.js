const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { MongoClient } = require('mongodb');
require('dotenv').config();

class DatabaseFromBackupCreator {
  constructor(options = {}) {
    // Ensure we're working from the project root directory
    const projectRoot = path.resolve(__dirname, '..');
    this.backupDir = path.join(projectRoot, 'backups');
    this.tempDir = path.join(projectRoot, 'temp-restore');
    this.configFile = path.join(projectRoot, 'database-config.json');
    this.logMessages = [];
    this.interactive = options.interactive !== false; // Default to interactive
    
    // Options
    this.backupPath = options.backupPath || null;
    this.targetUri = options.targetUri || null;
    this.databaseId = options.databaseId || null;
    this.databaseName = options.databaseName || null;
    this.description = options.description || null;
    this.addToConfig = options.addToConfig !== false; // Default to true
    
    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.logMessages.push(logEntry);
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  extractDbName(uri) {
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  }

  async listAvailableBackups() {
    this.log('Scanning for available backups...');
    
    if (!await fs.pathExists(this.backupDir)) {
      throw new Error('Backup directory does not exist. No backups found.');
    }
    
    const files = await fs.readdir(this.backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.zip') && file.startsWith('backup-')) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
        
        backups.push({
          filename: file,
          path: filePath,
          created: stats.mtime,
          size: `${sizeInMB} MB`,
          timestamp: file.replace('backup-', '').replace('.zip', '')
        });
      }
    }
    
    backups.sort((a, b) => b.created - a.created);
    return backups;
  }

  async selectBackup() {
    if (this.backupPath) {
      this.log(`Using specified backup: ${path.basename(this.backupPath)}`);
      return this.backupPath;
    }

    const backups = await this.listAvailableBackups();
    
    if (backups.length === 0) {
      throw new Error('No backup files found in the backups directory.');
    }
    
    if (!this.interactive) {
      this.log(`Using latest backup: ${backups[0].filename}`);
      return backups[0].path;
    }
    
    console.log('\n📁 Available Backups:');
    console.log('='.repeat(80));
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.filename}`);
      console.log(`   Created: ${backup.created.toLocaleString()}`);
      console.log(`   Size: ${backup.size}`);
      console.log('');
    });
    
    const answer = await this.prompt(`Select backup to restore (1-${backups.length}), or 'q' to quit: `);
    
    if (answer.toLowerCase() === 'q') {
      throw new Error('Operation cancelled by user');
    }
    
    const selectedIndex = parseInt(answer) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= backups.length) {
      throw new Error('Invalid selection');
    }
    
    return backups[selectedIndex].path;
  }

  async getDatabaseDetails() {
    if (this.targetUri && this.databaseId && this.databaseName) {
      return {
        uri: this.targetUri,
        id: this.databaseId,
        name: this.databaseName,
        description: this.description
      };
    }

    if (!this.interactive) {
      throw new Error('Non-interactive mode requires targetUri, databaseId, and databaseName options');
    }

    console.log('\n🗄️  Database Configuration:');
    console.log('='.repeat(50));

    const uri = this.targetUri || await this.prompt('MongoDB URI for new database: ');
    const id = this.databaseId || await this.prompt('Database ID (unique identifier): ');
    const name = this.databaseName || await this.prompt('Display name for database: ');
    const description = this.description || await this.prompt('Description (optional): ');

    return { uri, id, name, description };
  }

  async testConnection(uri) {
    this.log('Testing database connection...');
    
    let client;
    try {
      client = new MongoClient(uri);
      await client.connect();
      await client.db().admin().ping();
      this.log('✅ Database connection successful');
      return true;
    } catch (error) {
      this.log(`❌ Connection failed: ${error.message}`, 'error');
      return false;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async loadDatabaseConfig() {
    try {
      if (await fs.pathExists(this.configFile)) {
        return await fs.readJson(this.configFile);
      }
    } catch (error) {
      this.log(`Warning: Could not load database config: ${error.message}`, 'warn');
    }
    
    return {
      current: 'primary',
      databases: {
        primary: {
          name: 'Primary Database',
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2',
          description: 'Main ship collection database'
        }
      }
    };
  }

  async saveDatabaseConfig(config) {
    try {
      await fs.writeJson(this.configFile, config, { spaces: 2 });
      this.log('Database configuration updated');
    } catch (error) {
      this.log(`Warning: Could not save database config: ${error.message}`, 'warn');
    }
  }

  async addDatabaseToConfig(dbDetails) {
    if (!this.addToConfig) {
      this.log('Skipping database configuration update');
      return;
    }

    this.log('Adding database to configuration...');
    
    const config = await this.loadDatabaseConfig();
    
    if (config.databases[dbDetails.id]) {
      const overwrite = this.interactive ? 
        await this.prompt(`Database ID '${dbDetails.id}' already exists. Overwrite? (y/N): `) : 'n';
      
      if (overwrite.toLowerCase() !== 'y') {
        this.log('Skipping database configuration update');
        return;
      }
    }
    
    config.databases[dbDetails.id] = {
      name: dbDetails.name,
      uri: dbDetails.uri,
      description: dbDetails.description || ''
    };
    
    await this.saveDatabaseConfig(config);
    this.log(`Database '${dbDetails.id}' added to configuration`);
  }

  async extractBackup(backupZipPath) {
    this.log('Extracting backup archive...');
    
    await fs.remove(this.tempDir);
    await fs.ensureDir(this.tempDir);
    
    return new Promise((resolve, reject) => {
      const unzip = spawn('unzip', ['-q', backupZipPath, '-d', this.tempDir]);
      
      unzip.on('close', (code) => {
        if (code === 0) {
          this.log('Backup extracted successfully');
          resolve();
        } else {
          reject(new Error(`unzip failed with exit code ${code}`));
        }
      });
      
      unzip.on('error', (error) => {
        reject(new Error(`Extraction failed: ${error.message}`));
      });
    });
  }

  async validateBackup() {
    this.log('Validating backup contents...');
    
    // Check if backup files are directly in temp directory or in a subdirectory
    const databaseDir = path.join(this.tempDir, 'database');
    const uploadsDir = path.join(this.tempDir, 'uploads');
    const backupInfoFile = path.join(this.tempDir, 'backup-info.json');
    
    let backupContentDir = this.tempDir;
    
    // If files are not directly in temp dir, look for subdirectory
    if (!await fs.pathExists(databaseDir) || !await fs.pathExists(backupInfoFile)) {
      this.log('Backup files not in root, checking subdirectories...');
      
      const items = await fs.readdir(this.tempDir);
      const backupDirs = [];
      
      for (const item of items) {
        const itemPath = path.join(this.tempDir, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          backupDirs.push(item);
        }
      }
      
      if (backupDirs.length === 0) {
        throw new Error('No backup directory found in extracted archive');
      }
      
      backupContentDir = path.join(this.tempDir, backupDirs[0]);
      // Update paths to point to subdirectory
      const subDatabaseDir = path.join(backupContentDir, 'database');
      const subUploadsDir = path.join(backupContentDir, 'uploads');
      const subBackupInfoFile = path.join(backupContentDir, 'backup-info.json');
      
      if (await fs.pathExists(subDatabaseDir) && await fs.pathExists(subBackupInfoFile)) {
        // Use subdirectory structure
        const backupInfo = await fs.readJson(subBackupInfoFile);
        this.log(`Backup created: ${backupInfo.created}`);
        this.log(`Original database: ${backupInfo.dbName}`);
        this.log(`Collections: ${backupInfo.collections.join(', ')}`);
        
        return { 
          backupContentDir, 
          databaseDir: subDatabaseDir, 
          uploadsDir: subUploadsDir, 
          backupInfo 
        };
      }
    }
    
    // Validate root structure
    if (!await fs.pathExists(databaseDir)) {
      throw new Error('Database directory not found in backup');
    }
    
    if (!await fs.pathExists(backupInfoFile)) {
      throw new Error('Backup info file not found in backup');
    }
    
    const backupInfo = await fs.readJson(backupInfoFile);
    this.log(`Backup created: ${backupInfo.created}`);
    this.log(`Original database: ${backupInfo.dbName}`);
    this.log(`Collections: ${backupInfo.collections.join(', ')}`);
    
    return { backupContentDir, databaseDir, uploadsDir, backupInfo };
  }

  async restoreToDatabase(databaseDir, targetUri) {
    this.log(`Restoring backup to database: ${targetUri}`);
    
    return new Promise((resolve, reject) => {
      const mongorestoreArgs = [
        '--uri', targetUri,
        '--drop', // Drop existing collections before restore
        databaseDir
      ];
      
      this.log(`Running: mongorestore ${mongorestoreArgs.join(' ')}`);
      
      const mongorestore = spawn('mongorestore', mongorestoreArgs);
      
      let stdout = '';
      let stderr = '';
      
      mongorestore.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Show progress in real-time
        if (output.includes('finished') || output.includes('imported')) {
          this.log(output.trim());
        }
      });
      
      mongorestore.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          this.log('✅ Database restore completed successfully');
          resolve();
        } else {
          this.log(`❌ Database restore failed with code ${code}`, 'error');
          this.log(`Stderr: ${stderr}`, 'error');
          reject(new Error(`mongorestore failed with exit code ${code}: ${stderr}`));
        }
      });
      
      mongorestore.on('error', (error) => {
        reject(new Error(`mongorestore process error: ${error.message}`));
      });
    });
  }

  async cleanup() {
    this.log('Cleaning up temporary files...');
    try {
      await fs.remove(this.tempDir);
      this.log('Temporary files removed');
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'warn');
    }
  }

  async run() {
    const startTime = Date.now();
    this.log('=== Create Database from Backup Started ===');
    
    try {
      // Get database details
      const dbDetails = await this.getDatabaseDetails();
      this.log(`Target database: ${dbDetails.name} (${dbDetails.id})`);
      
      // Test connection to target database
      const connectionOk = await this.testConnection(dbDetails.uri);
      if (!connectionOk) {
        if (this.interactive) {
          const proceed = await this.prompt('Connection test failed. Continue anyway? (y/N): ');
          if (proceed.toLowerCase() !== 'y') {
            throw new Error('Operation cancelled due to connection failure');
          }
        } else {
          throw new Error('Cannot connect to target database');
        }
      }
      
      // Select and extract backup
      const backupPath = await this.selectBackup();
      await this.extractBackup(backupPath);
      
      // Validate backup
      const { databaseDir, backupInfo } = await this.validateBackup();
      
      // Confirm operation
      if (this.interactive) {
        console.log('\n📋 Operation Summary:');
        console.log(`• Source backup: ${path.basename(backupPath)}`);
        console.log(`• Target database: ${dbDetails.name}`);
        console.log(`• Database URI: ${dbDetails.uri}`);
        console.log(`• Collections to restore: ${backupInfo.collections.length}`);
        console.log(`• Original backup from: ${backupInfo.created}`);
        
        const confirm = await this.prompt('\nProceed with database creation? Type "YES" to continue: ');
        if (confirm !== 'YES') {
          throw new Error('Operation cancelled by user');
        }
      }
      
      // Restore backup to target database
      await this.restoreToDatabase(databaseDir, dbDetails.uri);
      
      // Add to database configuration
      await this.addDatabaseToConfig(dbDetails);
      
      // Cleanup
      await this.cleanup();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`=== Database Creation Completed Successfully in ${duration}s ===`);
      
      console.log('\n✅ Success!');
      console.log(`📊 Database '${dbDetails.name}' created from backup`);
      console.log(`🔗 URI: ${dbDetails.uri}`);
      console.log(`⏱️  Duration: ${duration}s`);
      
      return {
        success: true,
        database: dbDetails,
        backupInfo: backupInfo,
        duration: duration
      };
      
    } catch (error) {
      this.log(`Operation failed: ${error.message}`, 'error');
      await this.cleanup();
      throw error;
    } finally {
      this.rl.close();
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach((arg, index) => {
    if (arg === '--non-interactive') {
      options.interactive = false;
    } else if (arg === '--no-config') {
      options.addToConfig = false;
    } else if (arg.startsWith('--backup=')) {
      const projectRoot = path.resolve(__dirname, '..');
      options.backupPath = path.join(projectRoot, 'backups', arg.split('=')[1]);
    } else if (arg.startsWith('--uri=')) {
      options.targetUri = arg.split('=')[1];
    } else if (arg.startsWith('--id=')) {
      options.databaseId = arg.split('=')[1];
    } else if (arg.startsWith('--name=')) {
      options.databaseName = arg.split('=')[1];
    } else if (arg.startsWith('--description=')) {
      options.description = arg.split('=')[1];
    }
  });
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Create Database from Backup');
    console.log('============================');
    console.log('');
    console.log('Usage: node create-database-from-backup.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help                    Show this help message');
    console.log('  --non-interactive         Run without user prompts');
    console.log('  --no-config              Don\'t add database to configuration');
    console.log('  --backup=FILENAME         Use specific backup file');
    console.log('  --uri=URI                 Target MongoDB URI');
    console.log('  --id=ID                   Database configuration ID');
    console.log('  --name=NAME               Display name for database');
    console.log('  --description=DESC        Description for database');
    console.log('');
    console.log('Examples:');
    console.log('  # Interactive mode (default)');
    console.log('  node create-database-from-backup.js');
    console.log('');
    console.log('  # Non-interactive with specific backup');
    console.log('  node create-database-from-backup.js --non-interactive \\');
    console.log('    --backup=backup-2025-01-15T10-30-00.zip \\');
    console.log('    --uri=mongodb://localhost:27017/ship-collection-test \\');
    console.log('    --id=test-db --name="Test Database"');
    console.log('');
    process.exit(0);
  }
  
  const creator = new DatabaseFromBackupCreator(options);
  
  creator.run()
    .then((result) => {
      console.log(`\n🎉 Database '${result.database.name}' created successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to create database from backup!');
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = DatabaseFromBackupCreator; 