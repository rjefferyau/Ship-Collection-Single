const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { createReadStream } = require('fs');
const { pipeline } = require('stream');
const { createGunzip } = require('zlib');
require('dotenv').config();

class DatabaseRestore {
  constructor(options = {}) {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.tempDir = path.join(process.cwd(), 'temp-restore');
    this.logMessages = [];
    this.interactive = options.interactive || false;
    this.backupPath = options.backupPath || null;
    
    // MongoDB connection settings
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';
    this.dbName = this.extractDbName(this.mongoUri);
    
    // Setup readline interface for interactive prompts
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  extractDbName(uri) {
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : 'ship-collection-v2';
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
        resolve(answer);
      });
    });
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
    
    // Sort by creation time, newest first
    backups.sort((a, b) => b.created - a.created);
    
    return backups;
  }

  async selectBackup() {
    const backups = await this.listAvailableBackups();
    
    if (backups.length === 0) {
      throw new Error('No backup files found in the backups directory.');
    }
    
    if (!this.interactive) {
      // Return latest backup
      this.log(`Using latest backup: ${backups[0].filename}`);
      return backups[0].path;
    }
    
    // Interactive selection
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
      throw new Error('Restore cancelled by user');
    }
    
    const selectedIndex = parseInt(answer) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= backups.length) {
      throw new Error('Invalid selection');
    }
    
    return backups[selectedIndex].path;
  }

  async extractBackup(backupZipPath) {
    this.log('Extracting backup archive...');
    
    // Ensure temp directory exists and is clean
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
    
    // Find the backup directory (should be the only directory in temp)
    const items = await fs.readdir(this.tempDir);
    const backupDirs = items.filter(async item => {
      const itemPath = path.join(this.tempDir, item);
      return (await fs.stat(itemPath)).isDirectory();
    });
    
    if (backupDirs.length === 0) {
      throw new Error('No backup directory found in extracted archive');
    }
    
    const backupContentDir = path.join(this.tempDir, backupDirs[0]);
    
    // Check for required components
    const databaseDir = path.join(backupContentDir, 'database');
    const uploadsDir = path.join(backupContentDir, 'uploads');
    const backupInfoFile = path.join(backupContentDir, 'backup-info.json');
    
    if (!await fs.pathExists(databaseDir)) {
      throw new Error('Database directory not found in backup');
    }
    
    if (!await fs.pathExists(backupInfoFile)) {
      throw new Error('Backup info file not found in backup');
    }
    
    // Read and validate backup info
    const backupInfo = await fs.readJson(backupInfoFile);
    this.log(`Backup created: ${backupInfo.created}`);
    this.log(`Database: ${backupInfo.dbName}`);
    this.log(`Collections: ${backupInfo.collections.join(', ')}`);
    
    return {
      backupContentDir,
      databaseDir,
      uploadsDir,
      backupInfo
    };
  }

  async confirmRestore(backupInfo) {
    if (!this.interactive) {
      return true;
    }
    
    console.log('\n⚠️  WARNING: This will completely replace your current database!');
    console.log('Current data will be lost permanently.');
    console.log('\nBackup Information:');
    console.log(`- Created: ${backupInfo.created}`);
    console.log(`- Database: ${backupInfo.dbName}`);
    console.log(`- Collections: ${backupInfo.collections.length}`);
    console.log(`- Upload files: ${backupInfo.stats?.uploadFiles || 'Unknown'}`);
    
    const confirmation = await this.prompt('\nDo you want to proceed? Type "YES" to continue: ');
    
    if (confirmation !== 'YES') {
      throw new Error('Restore cancelled by user');
    }
    
    return true;
  }

  async dropExistingDatabase() {
    this.log('Dropping existing database...');
    
    return new Promise((resolve, reject) => {
      const mongosh = spawn('mongosh', [
        this.mongoUri,
        '--eval', `db.dropDatabase()`
      ]);
      
      let stdout = '';
      let stderr = '';
      
      mongosh.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      mongosh.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      mongosh.on('close', (code) => {
        if (code === 0) {
          this.log('Existing database dropped successfully');
          resolve();
        } else {
          this.log(`Database drop failed with code ${code}`, 'error');
          this.log(`Stderr: ${stderr}`, 'error');
          reject(new Error(`Database drop failed: ${stderr}`));
        }
      });
      
      mongosh.on('error', (error) => {
        // Try alternative approach with mongo shell
        this.log('Trying alternative mongo shell...', 'warn');
        const mongo = spawn('mongo', [
          this.mongoUri,
          '--eval', `db.dropDatabase()`
        ]);
        
        mongo.on('close', (altCode) => {
          if (altCode === 0) {
            this.log('Database dropped with alternative mongo shell');
            resolve();
          } else {
            reject(new Error(`Both mongosh and mongo failed to drop database`));
          }
        });
        
        mongo.on('error', () => {
          reject(new Error(`Cannot connect to MongoDB. Please ensure MongoDB is running.`));
        });
      });
    });
  }

  async restoreDatabase(databaseDir) {
    this.log('Restoring database from backup...');
    
    return new Promise((resolve, reject) => {
      const mongorestoreArgs = [
        '--uri', this.mongoUri,
        databaseDir
      ];
      
      this.log(`Running: mongorestore ${mongorestoreArgs.join(' ')}`);
      
      const mongorestore = spawn('mongorestore', mongorestoreArgs);
      
      let stdout = '';
      let stderr = '';
      
      mongorestore.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      mongorestore.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          this.log('Database restore completed successfully');
          this.log(`Stdout: ${stdout}`);
          resolve();
        } else {
          this.log(`Database restore failed with code ${code}`, 'error');
          this.log(`Stderr: ${stderr}`, 'error');
          reject(new Error(`mongorestore failed with exit code ${code}: ${stderr}`));
        }
      });
      
      mongorestore.on('error', (error) => {
        this.log(`Database restore process error: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  async restoreUploads(uploadsDir) {
    this.log('Restoring upload files...');
    
    if (!await fs.pathExists(uploadsDir)) {
      this.log('No uploads directory in backup, skipping file restore', 'warn');
      return 0;
    }
    
    const targetUploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Backup existing uploads
    const backupUploadsDir = path.join(process.cwd(), 'public', 'uploads-backup-' + Date.now());
    if (await fs.pathExists(targetUploadDir)) {
      this.log('Backing up existing uploads...');
      await fs.move(targetUploadDir, backupUploadsDir);
    }
    
    try {
      await fs.copy(uploadsDir, targetUploadDir, {
        overwrite: true,
        errorOnExist: false
      });
      
      const fileCount = await this.countFilesRecursive(targetUploadDir);
      this.log(`Restored ${fileCount} upload files`);
      
      // Remove backup of old uploads if restore was successful
      if (await fs.pathExists(backupUploadsDir)) {
        await fs.remove(backupUploadsDir);
        this.log('Removed backup of old uploads');
      }
      
      return fileCount;
    } catch (error) {
      // Restore old uploads if restore failed
      if (await fs.pathExists(backupUploadsDir)) {
        await fs.move(backupUploadsDir, targetUploadDir);
        this.log('Restored original uploads due to restore failure');
      }
      throw error;
    }
  }

  async countFilesRecursive(dirPath) {
    let count = 0;
    try {
      const items = await fs.readdir(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          count += await this.countFilesRecursive(itemPath);
        } else {
          count++;
        }
      }
    } catch (error) {
      this.log(`Error counting files in ${dirPath}: ${error.message}`, 'warn');
    }
    return count;
  }

  async cleanup() {
    this.log('Cleaning up temporary files...');
    try {
      await fs.remove(this.tempDir);
      this.log('Temporary restore directory removed');
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'warn');
    }
  }

  async run() {
    const startTime = Date.now();
    this.log('=== Database Restore Started ===');
    
    try {
      // Select backup to restore
      const backupPath = this.backupPath || await this.selectBackup();
      this.log(`Selected backup: ${path.basename(backupPath)}`);
      
      // Extract backup
      await this.extractBackup(backupPath);
      
      // Validate backup contents
      const { backupContentDir, databaseDir, uploadsDir, backupInfo } = await this.validateBackup();
      
      // Confirm restore operation
      await this.confirmRestore(backupInfo);
      
      // Drop existing database
      await this.dropExistingDatabase();
      
      // Restore database
      await this.restoreDatabase(databaseDir);
      
      // Restore upload files
      const uploadFileCount = await this.restoreUploads(uploadsDir);
      
      // Cleanup temporary files
      await this.cleanup();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`=== Restore Completed Successfully in ${duration}s ===`);
      this.log(`Upload files restored: ${uploadFileCount}`);
      
      return {
        success: true,
        backupInfo: backupInfo,
        uploadFiles: uploadFileCount,
        duration: duration
      };
      
    } catch (error) {
      this.log(`Restore failed: ${error.message}`, 'error');
      
      // Cleanup on failure
      try {
        await this.cleanup();
      } catch (cleanupError) {
        this.log(`Cleanup after failure error: ${cleanupError.message}`, 'error');
      }
      
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
  
  if (args.includes('--interactive')) {
    options.interactive = true;
  }
  
  if (args.includes('--latest')) {
    options.interactive = false;
  }
  
  const dateArg = args.find(arg => arg.startsWith('--date='));
  if (dateArg) {
    const date = dateArg.split('=')[1];
    options.backupPath = path.join(process.cwd(), 'backups', `backup-${date}.zip`);
  }
  
  const restore = new DatabaseRestore(options);
  
  restore.run()
    .then((result) => {
      console.log('\n✅ Restore completed successfully!');
      console.log(`📊 Upload files restored: ${result.uploadFiles}`);
      console.log(`⏱️  Duration: ${result.duration}s`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Restore failed!');
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = DatabaseRestore;