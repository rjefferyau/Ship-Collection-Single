const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
require('dotenv').config();

class FileBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.backupName = `files-backup-${this.timestamp}`;
    this.backupPath = path.join(this.backupDir, this.backupName);
    this.logMessages = [];
    
    // Directories to backup
    this.fileDirectories = [
      'public/uploads',
      'public/uploads/magazines',
      'public/images',
      'public/pdf-worker'
    ];
    
    // Individual files to backup
    this.individualFiles = [
      'public/favicon.ico',
      'public/robots.txt',
      'public/sample.csv',
      'public/placeholder-image.svg'
    ];
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
  }

  async countFilesRecursive(dirPath) {
    let count = 0;
    try {
      if (await fs.pathExists(dirPath)) {
        const items = await fs.readdir(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = await fs.stat(itemPath);
          if (stat.isDirectory()) {
            count += await this.countFilesRecursive(itemPath);
          } else {
            count++;
          }
        }
      }
    } catch (error) {
      this.log(`Error counting files in ${dirPath}: ${error.message}`, 'warn');
    }
    return count;
  }

  async calculateDirectorySize(dirPath) {
    let size = 0;
    try {
      if (await fs.pathExists(dirPath)) {
        const items = await fs.readdir(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = await fs.stat(itemPath);
          if (stat.isDirectory()) {
            size += await this.calculateDirectorySize(itemPath);
          } else {
            size += stat.size;
          }
        }
      }
    } catch (error) {
      this.log(`Error calculating size of ${dirPath}: ${error.message}`, 'warn');
    }
    return size;
  }

  async copyFiles() {
    this.log('Copying files...');
    
    let totalFiles = 0;
    let totalSize = 0;
    const backupStats = {
      directories: [],
      files: [],
      errors: []
    };

    // Copy directories
    for (const dir of this.fileDirectories) {
      const sourceDir = path.join(process.cwd(), dir);
      const targetDir = path.join(this.backupPath, dir);

      try {
        if (await fs.pathExists(sourceDir)) {
          await fs.copy(sourceDir, targetDir, {
            overwrite: true,
            errorOnExist: false
          });

          const fileCount = await this.countFilesRecursive(sourceDir);
          const dirSize = await this.calculateDirectorySize(sourceDir);
          
          this.log(`Copied ${fileCount} files from ${dir} (${(dirSize / 1024 / 1024).toFixed(2)} MB)`);
          
          totalFiles += fileCount;
          totalSize += dirSize;
          
          backupStats.directories.push({
            path: dir,
            fileCount: fileCount,
            size: dirSize
          });
        } else {
          this.log(`Directory ${dir} does not exist, skipping`, 'warn');
        }
      } catch (error) {
        this.log(`Error copying directory ${dir}: ${error.message}`, 'error');
        backupStats.errors.push({
          path: dir,
          error: error.message
        });
      }
    }

    // Copy individual files
    for (const file of this.individualFiles) {
      const sourceFile = path.join(process.cwd(), file);
      const targetFile = path.join(this.backupPath, file);

      try {
        if (await fs.pathExists(sourceFile)) {
          await fs.ensureDir(path.dirname(targetFile));
          await fs.copy(sourceFile, targetFile);
          
          const stat = await fs.stat(sourceFile);
          
          this.log(`Copied file ${file} (${(stat.size / 1024).toFixed(2)} KB)`);
          
          totalFiles += 1;
          totalSize += stat.size;
          
          backupStats.files.push({
            path: file,
            size: stat.size
          });
        } else {
          this.log(`File ${file} does not exist, skipping`, 'warn');
        }
      } catch (error) {
        this.log(`Error copying file ${file}: ${error.message}`, 'error');
        backupStats.errors.push({
          path: file,
          error: error.message
        });
      }
    }

    this.log(`Total files copied: ${totalFiles}`);
    this.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    return {
      totalFiles,
      totalSize,
      stats: backupStats
    };
  }

  async createBackupMetadata(copyResult) {
    this.log('Creating backup metadata...');
    
    const metadata = {
      type: 'file-backup',
      created: new Date().toISOString(),
      timestamp: this.timestamp,
      backupName: this.backupName,
      totalFiles: copyResult.totalFiles,
      totalSize: copyResult.totalSize,
      directories: this.fileDirectories,
      individualFiles: this.individualFiles,
      stats: copyResult.stats,
      version: '1.0.0'
    };

    const metadataPath = path.join(this.backupPath, 'file-backup-info.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    
    // Also save the log
    const logPath = path.join(this.backupPath, 'file-backup.log');
    await fs.writeFile(logPath, this.logMessages.join('\n'));
    
    return metadata;
  }

  async createZipArchive() {
    this.log('Creating ZIP archive...');
    
    const zipPath = `${this.backupPath}.zip`;
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        this.log(`ZIP archive created: ${zipPath} (${sizeInMB} MB)`);
        resolve({ zipPath, size: archive.pointer() });
      });

      archive.on('error', (err) => {
        reject(err);
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
    this.log('=== File Backup Started ===');
    this.log(`Backup name: ${this.backupName}`);
    
    try {
      // Create directories
      await this.ensureDirectories();
      
      // Copy files
      const copyResult = await this.copyFiles();
      
      // Create metadata
      const metadata = await this.createBackupMetadata(copyResult);
      
      // Create ZIP archive
      const archiveResult = await this.createZipArchive();
      
      // Cleanup temporary files
      await this.cleanup();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`=== File Backup Completed Successfully in ${duration}s ===`);
      this.log(`Archive: ${archiveResult.zipPath}`);
      
      console.log('\n✅ File backup completed successfully!');
      console.log(`📁 Archive: ${archiveResult.zipPath}`);
      console.log(`📊 Total files: ${copyResult.totalFiles}`);
      console.log(`💾 Total size: ${(copyResult.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🗜️  Compressed size: ${(archiveResult.size / 1024 / 1024).toFixed(2)} MB`);
      
      return {
        success: true,
        archivePath: archiveResult.zipPath,
        metadata: metadata,
        duration: duration
      };
      
    } catch (error) {
      this.log(`File backup failed: ${error.message}`, 'error');
      
      // Cleanup on failure
      try {
        await this.cleanup();
      } catch (cleanupError) {
        this.log(`Cleanup after failure error: ${cleanupError.message}`, 'error');
      }
      
      console.error('\n❌ File backup failed!');
      console.error(`Error: ${error.message}`);
      
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const backup = new FileBackup();
  
  backup.run()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = FileBackup; 