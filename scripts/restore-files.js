const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

class FileRestore {
  constructor(options = {}) {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.tempDir = path.join(process.cwd(), 'temp-file-restore');
    this.logMessages = [];
    this.interactive = options.interactive || false;
    this.backupPath = options.backupPath || null;
    
    // Setup readline interface for interactive prompts
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
        resolve(answer);
      });
    });
  }

  async listAvailableFileBackups() {
    this.log('Scanning for available file backups...');
    
    if (!await fs.pathExists(this.backupDir)) {
      throw new Error('Backup directory does not exist. No file backups found.');
    }
    
    const files = await fs.readdir(this.backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.zip') && file.startsWith('files-backup-')) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
        
        backups.push({
          filename: file,
          path: filePath,
          created: stats.mtime,
          size: `${sizeInMB} MB`,
          timestamp: file.replace('files-backup-', '').replace('.zip', '')
        });
      }
    }
    
    // Sort by creation time, newest first
    backups.sort((a, b) => b.created - a.created);
    
    return backups;
  }

  async selectBackup() {
    const backups = await this.listAvailableFileBackups();
    
    if (backups.length === 0) {
      throw new Error('No file backup files found in the backups directory.');
    }
    
    if (!this.interactive) {
      // Return latest backup
      this.log(`Using latest file backup: ${backups[0].filename}`);
      return backups[0].path;
    }
    
    // Interactive selection
    console.log('\n📁 Available File Backups:');
    console.log('='.repeat(80));
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.filename}`);
      console.log(`   Created: ${backup.created.toLocaleString()}`);
      console.log(`   Size: ${backup.size}`);
      console.log('');
    });
    
    const answer = await this.prompt(`Select file backup to restore (1-${backups.length}), or 'q' to quit: `);
    
    if (answer.toLowerCase() === 'q') {
      throw new Error('File restore cancelled by user');
    }
    
    const selectedIndex = parseInt(answer) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= backups.length) {
      throw new Error('Invalid selection');
    }
    
    return backups[selectedIndex].path;
  }

  async extractBackup(backupZipPath) {
    this.log('Extracting file backup archive...');
    
    // Ensure temp directory exists and is clean
    await fs.remove(this.tempDir);
    await fs.ensureDir(this.tempDir);
    
    return new Promise((resolve, reject) => {
      const unzip = spawn('unzip', ['-q', backupZipPath, '-d', this.tempDir]);
      
      unzip.on('close', (code) => {
        if (code === 0) {
          this.log('File backup extracted successfully');
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
    this.log('Validating file backup contents...');
    
    // The backup extracts directly to tempDir
    const backupContentDir = this.tempDir;
    
    // Check for required components
    const backupInfoFile = path.join(backupContentDir, 'file-backup-info.json');
    
    if (!await fs.pathExists(backupInfoFile)) {
      throw new Error('File backup info file not found in backup');
    }
    
    // Read and validate backup info
    const backupInfo = await fs.readJson(backupInfoFile);
    this.log(`File backup created: ${backupInfo.created}`);
    this.log(`Total files: ${backupInfo.totalFiles}`);
    this.log(`Total size: ${(backupInfo.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      backupContentDir,
      backupInfo
    };
  }

  async confirmRestore(backupInfo) {
    if (!this.interactive) {
      return true;
    }
    
    console.log('\n⚠️  WARNING: This will replace your current public files!');
    console.log('Existing files will be backed up but this operation cannot be easily undone.');
    console.log('\nFile Backup Information:');
    console.log(`- Created: ${backupInfo.created}`);
    console.log(`- Total files: ${backupInfo.totalFiles}`);
    console.log(`- Total size: ${(backupInfo.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    const confirmation = await this.prompt('\nDo you want to proceed? Type "YES" to continue: ');
    
    if (confirmation !== 'YES') {
      throw new Error('File restore cancelled by user');
    }
    
    return true;
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

  async backupExistingFiles(directories, files) {
    this.log('Backing up existing files...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupSuffix = `files-backup-${timestamp}`;
    let backedUpCount = 0;

    // Backup directories
    for (const dir of directories) {
      const sourceDir = path.join(process.cwd(), dir);
      if (await fs.pathExists(sourceDir)) {
        const backupDir = `${sourceDir}-${backupSuffix}`;
        try {
          await fs.move(sourceDir, backupDir);
          const fileCount = await this.countFilesRecursive(backupDir);
          this.log(`Backed up ${fileCount} files from ${dir} to ${path.basename(backupDir)}`);
          backedUpCount += fileCount;
        } catch (error) {
          this.log(`Error backing up directory ${dir}: ${error.message}`, 'error');
        }
      }
    }

    // Backup individual files
    for (const file of files) {
      const sourceFile = path.join(process.cwd(), file);
      if (await fs.pathExists(sourceFile)) {
        const backupFile = `${sourceFile}-${backupSuffix}`;
        try {
          await fs.move(sourceFile, backupFile);
          this.log(`Backed up file ${file} to ${path.basename(backupFile)}`);
          backedUpCount += 1;
        } catch (error) {
          this.log(`Error backing up file ${file}: ${error.message}`, 'error');
        }
      }
    }

    this.log(`Total files backed up: ${backedUpCount}`);
    return backedUpCount;
  }

  async restoreFiles(backupContentDir, backupInfo) {
    this.log('Restoring files from backup...');
    
    let restoredFiles = 0;
    let restoredSize = 0;

    // Restore directories
    for (const dirInfo of backupInfo.stats.directories) {
      const sourceDir = path.join(backupContentDir, dirInfo.path);
      const targetDir = path.join(process.cwd(), dirInfo.path);

      try {
        if (await fs.pathExists(sourceDir)) {
          await fs.ensureDir(path.dirname(targetDir));
          await fs.copy(sourceDir, targetDir, {
            overwrite: true,
            errorOnExist: false
          });

          this.log(`✓ Restored ${dirInfo.fileCount} files to ${dirInfo.path} (${(dirInfo.size / 1024 / 1024).toFixed(2)} MB)`);
          restoredFiles += dirInfo.fileCount;
          restoredSize += dirInfo.size;
        }
      } catch (error) {
        this.log(`Error restoring directory ${dirInfo.path}: ${error.message}`, 'error');
      }
    }

    // Restore individual files
    for (const fileInfo of backupInfo.stats.files) {
      const sourceFile = path.join(backupContentDir, fileInfo.path);
      const targetFile = path.join(process.cwd(), fileInfo.path);

      try {
        if (await fs.pathExists(sourceFile)) {
          await fs.ensureDir(path.dirname(targetFile));
          await fs.copy(sourceFile, targetFile);
          
          this.log(`✓ Restored file ${fileInfo.path} (${(fileInfo.size / 1024).toFixed(2)} KB)`);
          restoredFiles += 1;
          restoredSize += fileInfo.size;
        }
      } catch (error) {
        this.log(`Error restoring file ${fileInfo.path}: ${error.message}`, 'error');
      }
    }

    this.log(`File restore completed: ${restoredFiles} files, ${(restoredSize / 1024 / 1024).toFixed(2)} MB total`);
    return restoredFiles;
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
    this.log('=== File Restore Started ===');
    
    try {
      // Select backup to restore
      const backupPath = this.backupPath || await this.selectBackup();
      this.log(`Selected backup: ${path.basename(backupPath)}`);
      
      // Extract backup
      await this.extractBackup(backupPath);
      
      // Validate backup contents
      const { backupContentDir, backupInfo } = await this.validateBackup();
      
      // Confirm restore operation
      await this.confirmRestore(backupInfo);
      
      // Backup existing files
      const backedUpCount = await this.backupExistingFiles(
        backupInfo.directories,
        backupInfo.individualFiles
      );
      
      // Restore files
      const restoredFiles = await this.restoreFiles(backupContentDir, backupInfo);
      
      // Cleanup temporary files
      await this.cleanup();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`=== File Restore Completed Successfully in ${duration}s ===`);
      this.log(`Files restored: ${restoredFiles}`);
      
      console.log('\n✅ File restore completed successfully!');
      console.log(`📊 Files restored: ${restoredFiles}`);
      console.log(`📦 Files backed up: ${backedUpCount}`);
      console.log(`⏱️  Duration: ${duration}s`);
      
      return {
        success: true,
        backupInfo: backupInfo,
        restoredFiles: restoredFiles,
        backedUpFiles: backedUpCount,
        duration: duration
      };
      
    } catch (error) {
      this.log(`File restore failed: ${error.message}`, 'error');
      
      // Cleanup on failure
      try {
        await this.cleanup();
      } catch (cleanupError) {
        this.log(`Cleanup after failure error: ${cleanupError.message}`, 'error');
      }
      
      console.error('\n❌ File restore failed!');
      console.error(`Error: ${error.message}`);
      
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
    options.backupPath = path.join(process.cwd(), 'backups', `files-backup-${date}.zip`);
  }
  
  const restore = new FileRestore(options);
  
  restore.run()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = FileRestore; 