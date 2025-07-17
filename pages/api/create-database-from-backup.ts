import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs-extra';

// Import the script class
const DatabaseFromBackupCreator = require('../../scripts/create-database-from-backup');

interface CreateDatabaseRequest {
  backupFile: string;
  databaseId: string;
  databaseName: string;
  databaseUri: string;
  description?: string;
}

interface DatabaseConfig {
  current: string;
  databases: {
    [key: string]: {
      name: string;
      uri: string;
      description: string;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { backupFile, databaseId, databaseName, databaseUri, description }: CreateDatabaseRequest = req.body;

    // Validation
    if (!backupFile) {
      return res.status(400).json({ error: 'Backup file is required' });
    }
    if (!databaseId) {
      return res.status(400).json({ error: 'Database ID is required' });
    }
    if (!databaseName) {
      return res.status(400).json({ error: 'Database name is required' });
    }
    if (!databaseUri) {
      return res.status(400).json({ error: 'Database URI is required' });
    }

    // Check if backup file exists
    const projectRoot = path.resolve(process.cwd());
    const backupPath = path.join(projectRoot, 'backups', backupFile);
    
    if (!await fs.pathExists(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Check if database ID already exists
    const configFile = path.join(projectRoot, 'database-config.json');
    let config: DatabaseConfig = {
      current: 'primary',
      databases: {
        primary: {
          name: 'Primary Database',
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2',
          description: 'Main ship collection database'
        }
      }
    };

    if (await fs.pathExists(configFile)) {
      try {
        config = await fs.readJson(configFile);
      } catch (error) {
        console.log('Could not read existing config, using default');
      }
    }

    if (config.databases[databaseId]) {
      return res.status(409).json({ error: `Database ID '${databaseId}' already exists` });
    }

    // Create database from backup using the script
    const creator = new DatabaseFromBackupCreator({
      interactive: false,
      backupPath: backupPath,
      targetUri: databaseUri,
      databaseId: databaseId,
      databaseName: databaseName,
      description: description || '',
      addToConfig: true
    });

    const result = await creator.run();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Database '${databaseName}' created successfully`,
        database: result.database,
        duration: result.duration
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create database from backup'
      });
    }

  } catch (error: any) {
    console.error('Error creating database from backup:', error);
    
    // Return more specific error messages based on the error type
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message.includes('mongorestore')) {
      errorMessage = 'MongoDB tools not found. Please install MongoDB Database Tools to use this feature.';
    } else if (error.message.includes('Connection')) {
      errorMessage = 'Failed to connect to the target database. Please check your connection settings.';
    } else if (error.message.includes('unzip')) {
      errorMessage = 'Failed to extract backup file. Please ensure the backup file is valid.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

// Configure request size limit for large backup files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: false,
  },
}; 