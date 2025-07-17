# Ship Collection App - Mac Setup Guide

This guide will help you set up your Ship Collection application on macOS.

## 📋 Prerequisites

### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js (version 18 or higher)
```bash
# Install Node.js via Homebrew
brew install node

# Verify installation
node --version  # Should show v18+ 
npm --version   # Should show npm version
```

### 3. Install Git (if not already installed)
```bash
brew install git
```

### 4. Install MongoDB (Choose ONE option)

#### Option A: MongoDB Atlas (Cloud - Recommended)
- Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a free account and cluster
- Get your connection string (you'll need this later)

#### Option B: Local MongoDB
```bash
# Install MongoDB via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Your local connection string will be: mongodb://localhost:27017/ship-collection-v2
```

## 🚀 Installation Steps

### 1. Download/Clone the Repository

#### Option A: Download ZIP
1. Go to your GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file to your desired location
4. Open Terminal and navigate to the folder:
```bash
cd /path/to/Ship-Collection-Single
```

#### Option B: Clone with Git
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Ship-Collection-Single.git
cd Ship-Collection-Single
```

### 2. Install Dependencies
```bash
# Install all npm packages
npm install

# This will install all required dependencies including:
# - Next.js, React, TypeScript
# - MongoDB drivers
# - FontAwesome icons
# - All other required packages
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:
```bash
# Create the environment file
touch .env.local
```

Add your MongoDB connection string to `.env.local`:
```env
# For MongoDB Atlas (replace with your actual connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ship-collection-v2?retryWrites=true&w=majority

# For Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/ship-collection-v2

# Optional: Set custom port (default is 3000)
# PORT=3001
```

### 4. First Run
```bash
# Start the development server
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://[your-mac-ip]:3000

## 📦 Restoring Your Data

### 1. Upload Your Backup Files

Create a `backups` folder and add your backup files:
```bash
# Create backups directory
mkdir backups

# Copy your backup files here
# You can drag and drop or use cp command:
# cp /path/to/your/backup-files/*.zip backups/
```

Your backup files should be named like:
- `backup-2025-07-17T00-32-58.zip` (Database + Files)
- `files-backup-2025-07-17T00-44-00.zip` (Files only)

### 2. Restore Database

1. Open your browser and go to http://localhost:3000/database-setup
2. Click "Backup Management" 
3. You should see your backup files listed
4. Click the restore button (🔄) next to your backup
5. Follow the restore wizard

#### Alternative: Command Line Restore
```bash
# Restore database backup
node scripts/restore-database.js

# Restore file backup
node scripts/restore-files.js
```

## 🔧 Configuration

### Database Configuration

If you need to switch between different MongoDB databases:

1. Go to http://localhost:3000/database-setup
2. Click "Database Configuration"
3. Add your database connections
4. Switch between them as needed

### Environment Variables

You can customize these in your `.env.local` file:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Server Port (optional)
PORT=3000

# Node Environment
NODE_ENV=development
```

## 🛠 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Create database backup
node scripts/backup-database.js

# Create file backup
node scripts/backup-files.js

# Restore database
node scripts/restore-database.js

# Restore files
node scripts/restore-files.js
```

## 📁 Project Structure

```
Ship-Collection-Single/
├── components/          # React components
├── pages/              # Next.js pages and API routes
├── scripts/            # Backup/restore scripts
├── models/             # Database models
├── lib/                # Utility libraries
├── public/             # Static files and uploads
├── backups/            # Your backup files go here
├── styles/             # CSS styles
└── .env.local          # Environment variables
```

## 🔍 Troubleshooting

### Common Issues:

#### 1. Port Already in Use
If port 3000 is busy, the app will automatically use 3001. Or set a custom port:
```bash
PORT=3002 npm run dev
```

#### 2. MongoDB Connection Issues
- Verify your connection string in `.env.local`
- For Atlas: Check IP whitelist and credentials
- For local: Ensure MongoDB service is running

#### 3. Permission Issues
```bash
# Fix npm permissions if needed
sudo chown -R $(whoami) ~/.npm
```

#### 4. Node Version Issues
```bash
# Check Node version
node --version

# Update if needed
brew upgrade node
```

### Getting Help

1. Check the browser console for errors (F12)
2. Check terminal output for error messages
3. Verify all environment variables are set correctly
4. Ensure MongoDB is accessible

## 🎉 Success!

Once everything is running:

1. **Main App**: http://localhost:3000
2. **Database Setup**: http://localhost:3000/database-setup
3. **Statistics**: http://localhost:3000/statistics
4. **Management**: http://localhost:3000/management

Your ship collection data should now be fully restored and accessible on your Mac! 🚀

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Node.js on macOS](https://nodejs.org/en/download/package-manager/#macos)

---

**Need help?** Check the browser console and terminal output for specific error messages. 