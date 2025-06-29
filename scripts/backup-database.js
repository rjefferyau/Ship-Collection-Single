const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const mongoose = require('mongoose');
require('dotenv').config();

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.backupName = `backup-${this.timestamp}`;
    this.backupPath = path.join(this.backupDir, this.backupName);
    this.logMessages = [];
    
    // MongoDB connection settings
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';
    this.dbName = this.extractDbName(this.mongoUri);
    
    // Collections to backup (only current v5 schema)
    this.collections = [
      'starshipv5',
      'editions', 
      'franchises',
      'manufacturers',
      'factions',
      'collectiontypes',
      'customviews'
    ];
    
    // Upload directories to backup
    this.uploadDirs = [
      'public/uploads',
      'public/uploads/magazines'
    ];
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

  async ensureDirectories() {
    this.log('Creating backup directories...');
    await fs.ensureDir(this.backupDir);
    await fs.ensureDir(this.backupPath);
    await fs.ensureDir(path.join(this.backupPath, 'database'));
    await fs.ensureDir(path.join(this.backupPath, 'uploads'));
    await fs.ensureDir(path.join(this.backupPath, 'uploads', 'magazines'));
  }

  async connectToDatabase() {
    this.log('Connecting to MongoDB...');
    try {
      // Use the same connection options as the main app
      const opts = {
        bufferCommands: false,
      };
      
      await mongoose.connect(this.mongoUri, opts);
      this.log('Connected to MongoDB successfully');
      return mongoose.connection.db;
    } catch (error) {
      this.log(`Failed to connect to MongoDB: ${error.message}`, 'error');
      this.log(`Connection URI: ${this.mongoUri.replace(/\/\/[^@]*@/, '//***:***@')}`, 'error');
      throw new Error(`Cannot connect to MongoDB. Please ensure MongoDB is running and accessible at ${this.mongoUri.replace(/\/\/[^@]*@/, '//***:***@')}`);
    }
  }

  async exportCollection(db, collectionName) {
    this.log(`Exporting collection: ${collectionName}`);
    
    try {
      const collection = db.collection(collectionName);
      
      // Get collection stats
      const stats = await collection.stats().catch(() => ({ count: 0 }));
      this.log(`Collection ${collectionName} has ${stats.count} documents`);
      
      if (stats.count === 0) {
        this.log(`Collection ${collectionName} is empty, creating empty backup`, 'warn');
        const emptyBackup = {
          collection: collectionName,
          timestamp: new Date().toISOString(),
          documents: [],
          count: 0
        };
        
        const filePath = path.join(this.backupPath, 'database', `${collectionName}.json`);
        await fs.writeJson(filePath, emptyBackup, { spaces: 2 });
        return 0;
      }
      
      // Export all documents
      const documents = await collection.find({}).toArray();
      
      const backup = {
        collection: collectionName,
        timestamp: new Date().toISOString(),
        documents: documents,
        count: documents.length
      };
      
      const filePath = path.join(this.backupPath, 'database', `${collectionName}.json`);
      await fs.writeJson(filePath, backup, { spaces: 2 });
      
      this.log(`✓ Exported ${documents.length} documents from ${collectionName}`);
      return documents.length;
      
    } catch (error) {
      this.log(`✗ Failed to export ${collectionName}: ${error.message}`, 'error');
      
      // Create empty backup file to indicate collection exists but failed to export
      const errorBackup = {
        collection: collectionName,
        timestamp: new Date().toISOString(),
        error: error.message,
        documents: [],
        count: 0
      };
      
      const filePath = path.join(this.backupPath, 'database', `${collectionName}.json`);
      await fs.writeJson(filePath, errorBackup, { spaces: 2 });
      
      return 0;
    }
  }

  async createDatabaseBackup() {
    this.log('Starting database backup...');
    
    let totalDocuments = 0;
    let successfulCollections = 0;
    
    try {
      const db = await this.connectToDatabase();
      
      // Export each collection
      for (const collectionName of this.collections) {
        try {
          const docCount = await this.exportCollection(db, collectionName);
          totalDocuments += docCount;
          successfulCollections++;
        } catch (error) {
          this.log(`Failed to export collection ${collectionName}: ${error.message}`, 'error');
        }
      }
      
      this.log(`Database backup completed: ${successfulCollections}/${this.collections.length} collections, ${totalDocuments} total documents`);
      
      return {
        totalCollections: this.collections.length,
        successfulCollections,
        totalDocuments
      };
      
    } finally {
      // Always close the connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        this.log('MongoDB connection closed');
      }
    }
  }

  async copyUploadFiles() {
    this.log('Copying upload files...');
    
    let totalFilesCopied = 0;
    
    for (const uploadDir of this.uploadDirs) {
      const sourcePath = path.join(process.cwd(), uploadDir);
      const destPath = path.join(this.backupPath, uploadDir.replace('public/', ''));
      
      try {
        if (await fs.pathExists(sourcePath)) {
          await fs.ensureDir(path.dirname(destPath));
          await fs.copy(sourcePath, destPath, {
            overwrite: true,
            errorOnExist: false
          });
          
          const files = await this.countFilesRecursive(sourcePath);
          totalFilesCopied += files;
          this.log(`Copied ${files} files from ${uploadDir}`);
        } else {
          this.log(`Upload directory ${uploadDir} does not exist, skipping...`, 'warn');
        }
      } catch (error) {
        this.log(`Error copying ${uploadDir}: ${error.message}`, 'error');
        throw error;
      }
    }
    
    this.log(`Total files copied: ${totalFilesCopied}`);
    return totalFilesCopied;
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

  async validateBackup() {
    this.log('Validating backup...');
    
    const dbPath = path.join(this.backupPath, 'database');
    
    // Check if database backup directory exists
    if (!await fs.pathExists(dbPath)) {
      throw new Error('Database backup directory not found');
    }
    
    // Check for expected collections
    let collectionsFound = 0;
    let totalDocuments = 0;
    
    for (const collection of this.collections) {
      const jsonFile = path.join(dbPath, `${collection}.json`);
      
      if (await fs.pathExists(jsonFile)) {
        try {
          const backupData = await fs.readJson(jsonFile);
          if (backupData.error) {
            this.log(`⚠ Collection ${collection} backup contains error: ${backupData.error}`, 'warn');
          } else {
            this.log(`✓ Collection ${collection}: ${backupData.count} documents`);
            totalDocuments += backupData.count;
          }
          collectionsFound++;
        } catch (error) {
          this.log(`✗ Collection ${collection} backup file is corrupted`, 'error');
        }
      } else {
        this.log(`✗ Collection ${collection} backup file missing`, 'warn');
      }
    }
    
    this.log(`${collectionsFound}/${this.collections.length} collections backed up, ${totalDocuments} total documents`);
    
    // Check upload files
    const uploadsPath = path.join(this.backupPath, 'uploads');
    const uploadFileCount = await this.countFilesRecursive(uploadsPath);
    this.log(`${uploadFileCount} upload files backed up`);
    
    return {
      collectionsFound,
      totalCollections: this.collections.length,
      totalDocuments,
      uploadFiles: uploadFileCount
    };
  }

  async createBackupInfo(stats) {
    this.log('Creating backup metadata...');
    
    const backupInfo = {
      timestamp: this.timestamp,
      created: new Date().toISOString(),
      dbName: this.dbName,
      collections: this.collections,
      stats: stats,
      backupType: 'json-export',
      mongoUri: this.mongoUri.replace(/\/\/[^@]*@/, '//***:***@'), // Hide credentials
      version: '1.0',
      nodeVersion: process.version
    };
    
    await fs.writeJson(path.join(this.backupPath, 'backup-info.json'), backupInfo, { spaces: 2 });
    
    // Write log file
    await fs.writeFile(path.join(this.backupPath, 'backup.log'), this.logMessages.join('\n'));
    
    return backupInfo;
  }

  async createZipArchive() {
    this.log('Creating ZIP archive...');
    
    const zipPath = `${this.backupPath}.zip`;
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        this.log(`ZIP archive created: ${zipPath} (${sizeInMB} MB)`);
        resolve(zipPath);
      });
      
      archive.on('error', (error) => {
        this.log(`ZIP creation error: ${error.message}`, 'error');
        reject(error);
      });
      
      archive.pipe(output);
      archive.directory(this.backupPath, false);
      archive.finalize();
    });
  }

  async cleanup() {
    this.log('Cleaning up temporary files...');
    try {
      await fs.remove(this.backupPath);
      this.log('Temporary backup directory removed');
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'warn');
    }
  }

  async run() {
    const startTime = Date.now();
    this.log('=== Database Backup Started ===');
    this.log(`Backup name: ${this.backupName}`);
    this.log(`Database: ${this.dbName}`);
    
    try {
      // Create directories
      await this.ensureDirectories();
      
      // Create database backup using Mongoose
      await this.createDatabaseBackup();
      
      // Copy upload files
      await this.copyUploadFiles();
      
      // Validate backup
      const stats = await this.validateBackup();
      
      // Create backup metadata
      const backupInfo = await this.createBackupInfo(stats);
      
      // Create ZIP archive
      const zipPath = await this.createZipArchive();
      
      // Cleanup temporary directory
      await this.cleanup();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`=== Backup Completed Successfully in ${duration}s ===`);
      this.log(`Archive: ${zipPath}`);
      
      return {
        success: true,
        backupPath: zipPath,
        backupInfo: backupInfo,
        duration: duration
      };
      
    } catch (error) {
      this.log(`Backup failed: ${error.message}`, 'error');
      
      // Cleanup on failure
      try {
        await this.cleanup();
        await fs.remove(`${this.backupPath}.zip`);
      } catch (cleanupError) {
        this.log(`Cleanup after failure error: ${cleanupError.message}`, 'error');
      }
      
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const backup = new DatabaseBackup();
  
  backup.run()
    .then((result) => {
      console.log('\n✅ Backup completed successfully!');
      console.log(`📁 Archive: ${result.backupPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup failed!');
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = DatabaseBackup;