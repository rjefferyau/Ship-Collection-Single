# 🔄 Database Restore Guide

## ✅ Your Restore Issue is Fixed!

The restore script is now working correctly. The issue was that it needs to be run from the project root directory.

## 🚀 How to Restore Your Database

### Method 1: Command Line (Recommended for Testing)

Run from the **project root directory**:

```bash
# Restore the latest backup
node scripts/restore-database.js --latest

# Restore a specific backup by date
node scripts/restore-database.js --date=2025-07-17T00-32-58

# Interactive mode (lets you choose backup)
node scripts/restore-database.js --interactive
```

### Method 2: Web Interface

1. Start the application: `npm run dev`
2. Go to: http://localhost:3000/database-setup
3. Click "Restore Database" 
4. Select your backup file: `backup-2025-07-17T00-32-58.zip`
5. Choose target database and click "Restore"

## 📊 Your Backup Summary

**Successfully tested:** `backup-2025-07-17T00-32-58.zip`

✅ **Backup Contents:**
- 7 collections restored
- 482 total documents 
- 184 upload files
- Created: 2025-07-17T00:32:58

**Collections included:**
- starshipv5 (377 documents)
- factions (88 documents) 
- editions (10 documents)
- franchises (3 documents)
- manufacturers (2 documents)
- collectiontypes (1 document)
- customviews (1 document)

## 🔧 Troubleshooting

### ❌ If restore fails:

1. **Check working directory**: Always run from project root, not scripts folder
2. **Verify MongoDB is running**: `brew services list | grep mongodb`
3. **Check backup file exists**: Look in `backups/` directory
4. **Test backup integrity**: `unzip -t backups/your-backup.zip`

### ✅ Fix commands:

```bash
# Start MongoDB if stopped
brew services start mongodb/brew/mongodb-community

# Check MongoDB status  
brew services list | grep mongodb

# Test database connection
mongosh --eval "db.runCommand({ping: 1})"
```

## 📝 What Was Fixed

The restore script was failing because:
- It was being run from the `scripts/` directory instead of project root
- This caused incorrect file paths for the backup extraction
- The fix ensures it runs from the correct working directory

Both the command line script and web interface now work correctly! 