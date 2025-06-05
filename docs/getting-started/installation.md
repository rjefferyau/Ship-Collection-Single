# Installation Guide

This guide will walk you through the process of setting up the Starship Collection Manager on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or later)
  - To check your version: `node --version`
  - Download from: [Node.js Official Website](https://nodejs.org/)
- MongoDB (v4.4 or later)
  - Local installation or MongoDB Atlas account
  - Download from: [MongoDB Official Website](https://www.mongodb.com/try/download/community)
- Git
  - Download from: [Git Official Website](https://git-scm.com/downloads)

## Step 1: Clone the Repository

1. Open your terminal and navigate to your desired installation directory
2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ship-collection.git
   cd ship-collection
   ```

## Step 2: Install Dependencies

1. Install the required npm packages:
   ```bash
   npm install
   ```

2. Verify the installation:
   ```bash
   npm list --depth=0
   ```
   This should show all the main dependencies without errors.

## Step 3: Environment Configuration

1. Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```

2. Add the following environment variables:
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/ship-collection
   
   # Optional: MongoDB Atlas Connection (if using Atlas)
   # MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ship-collection?retryWrites=true&w=majority
   
   # Application Settings
   NODE_ENV=development
   PORT=3000
   ```

## Step 4: Database Setup

### Local MongoDB Setup

1. Start MongoDB service:
   - Windows: MongoDB should run as a service
   - macOS/Linux: `sudo service mongod start`

2. Create the database:
   ```bash
   mongosh
   use ship-collection
   ```

### MongoDB Atlas Setup

1. Create a new cluster on MongoDB Atlas
2. Set up database access (create a user)
3. Set up network access (whitelist your IP)
4. Get your connection string and update the `.env.local` file

## Step 5: Start the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

   Or use the auto-restart script (Windows):
   ```bash
   ./start-auto-server.bat
   ```

2. The application should now be running at `http://localhost:3000`

## Step 6: Verify Installation

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the main application interface
3. Check the database connection by:
   - Opening the settings menu (gear icon)
   - Selecting "Database Check & Maintenance"
   - Verifying the connection status is "Connected"

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check your connection string
   - Ensure network access is properly configured

2. **Port Already in Use**
   - Change the PORT in `.env.local`
   - Kill the process using the port:
     ```bash
     # Windows
     netstat -ano | findstr :3000
     taskkill /PID <PID> /F
     
     # macOS/Linux
     lsof -i :3000
     kill -9 <PID>
     ```

3. **Missing Dependencies**
   - Delete `node_modules` folder
   - Delete `package-lock.json`
   - Run `npm install` again

## Next Steps

- Read the [Basic Usage Guide](basic-usage.md)
- Set up your [Configuration](configuration.md)
- Import your first [CSV Data](../data-management/csv-import.md)

## Support

If you encounter any issues during installation:
1. Check the [Common Issues](../troubleshooting/common-issues.md) section
2. Search through the documentation
3. Open an issue on GitHub
4. Contact the development team 