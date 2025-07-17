# 📋 Mac Setup Checklist

Quick setup guide for your Ship Collection app on Mac.

## ⚡ Quick Setup (Automated)

**Option 1: Use the setup script**
```bash
# After downloading/cloning the repo
cd Ship-Collection-Single
chmod +x setup-mac.sh
./setup-mac.sh
```

## 📝 Manual Setup Checklist

### □ **Step 1: Prerequisites**
- [ ] Install Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- [ ] Install Node.js: `brew install node`
- [ ] Install Git: `brew install git`
- [ ] Set up MongoDB (Atlas recommended) or `brew install mongodb-community`

### □ **Step 2: Get the Code**
- [ ] Download ZIP from GitHub OR clone: `git clone [your-repo-url]`
- [ ] Navigate to folder: `cd Ship-Collection-Single`

### □ **Step 3: Install & Configure**
- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` file with your MongoDB connection string:
```env
MONGODB_URI=your_mongodb_connection_string_here
```

### □ **Step 4: Prepare Your Data**
- [ ] Create `backups` folder: `mkdir backups`
- [ ] Copy your backup ZIP files to the `backups/` folder
- [ ] Files should be named like: `backup-2025-07-17T00-32-58.zip`

### □ **Step 5: Start the App**
- [ ] Run: `npm run dev`
- [ ] Open browser: http://localhost:3000
- [ ] Go to Database Setup: http://localhost:3000/database-setup

### □ **Step 6: Restore Your Data**
- [ ] Click "Backup Management" on Database Setup page
- [ ] Find your backup files in the list
- [ ] Click the restore button (🔄) next to your backup
- [ ] Follow the restore wizard
- [ ] Wait for completion

## ✅ Success Checklist

When everything is working, you should have:

- [ ] App running at http://localhost:3000
- [ ] All your starships visible in the collection
- [ ] Images displaying correctly
- [ ] Statistics showing correct numbers
- [ ] Search and filters working

## 🔧 Quick Commands

```bash
# Start the app
npm run dev

# Create new backups
node scripts/backup-database.js
node scripts/backup-files.js

# Restore from backup (alternative to web interface)
node scripts/restore-database.js
node scripts/restore-files.js
```

## 🚨 Common Issues & Solutions

**Port 3000 in use?**
- App will auto-use 3001, or set: `PORT=3002 npm run dev`

**MongoDB connection error?**
- Check `.env.local` has correct connection string
- For Atlas: verify IP whitelist and credentials

**Missing dependencies?**
- Run: `npm install` again

**Permission errors?**
- Run: `sudo chown -R $(whoami) ~/.npm`

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check terminal output for error messages  
3. Verify `.env.local` settings
4. Ensure MongoDB is accessible

---

**🎯 Goal**: Get from zero to fully running Ship Collection app with all your data restored!

**⏱️ Estimated time**: 15-30 minutes (depending on backup size) 