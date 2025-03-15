# Migrating to MongoDB Atlas

This document provides instructions for migrating your local MongoDB database to MongoDB Atlas.

## Prerequisites

1. MongoDB Atlas account
2. Node.js installed
3. Exported MongoDB data (in the `mongodb_export` directory)

## Step 1: Create a MongoDB Atlas Account and Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. After signing up and logging in, create a new project.
3. Click "Build a Database" and select the free tier option (M0).
4. Choose your preferred cloud provider and region.
5. Name your cluster (e.g., "ShipCollection").
6. Click "Create Cluster" and wait for the cluster to be provisioned.

## Step 2: Set Up Database Access

1. In the left sidebar, click "Database Access" under the Security section.
2. Click "Add New Database User".
3. Create a username and a strong password. Make sure to save these credentials.
4. Set privileges to "Read and Write to Any Database".
5. Click "Add User".

## Step 3: Set Up Network Access

1. In the left sidebar, click "Network Access" under the Security section.
2. Click "Add IP Address".
3. For development, you can select "Allow Access from Anywhere" (0.0.0.0/0).
4. Click "Confirm".

## Step 4: Get Your Connection String

1. Go back to the "Database" section and click "Connect" on your cluster.
2. Select "Connect your application".
3. Choose "Node.js" as the driver.
4. Copy the connection string. It will look something like:
   ```
   mongodb+srv://<username>:<password>@shipcollection.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with the credentials you created earlier.
6. Add your database name to the connection string:
   ```
   mongodb+srv://<username>:<password>@shipcollection.xxxxx.mongodb.net/ship-collection-v2?retryWrites=true&w=majority
   ```

## Step 5: Update Your Environment Variables

1. Open your `.env.local` file.
2. Replace the `MONGODB_URI` value with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@shipcollection.xxxxx.mongodb.net/ship-collection-v2?retryWrites=true&w=majority
   ```

## Step 6: Run the Migration Script

1. Make sure you have the exported MongoDB data in the `mongodb_export` directory.
2. Run the migration script:
   ```
   node migrate-to-atlas.js
   ```
3. The script will connect to MongoDB Atlas and import your data.

## Step 7: Verify the Migration

1. In MongoDB Atlas, click on "Browse Collections" for your cluster.
2. Verify that your collections and documents have been imported correctly.

## Step 8: Update Your Application

1. Restart your application:
   ```
   npm run dev
   ```
2. Test your application to ensure it's working correctly with MongoDB Atlas.

## Troubleshooting

- If you encounter connection issues, make sure your IP address is allowed in the Network Access settings.
- If you see authentication errors, verify your username and password in the connection string.
- If collections are missing, check the export directory to ensure all collections were exported correctly. 