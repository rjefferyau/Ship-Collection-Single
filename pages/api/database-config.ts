import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs-extra';
import path from 'path';

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

const configPath = path.join(process.cwd(), '.database-config.json');

const getDefaultConfig = (): DatabaseConfig => ({
  current: 'primary',
  databases: {
    primary: {
      name: 'Primary Database',
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2',
      description: 'Main collection database'
    }
  }
});

async function loadConfig(): Promise<DatabaseConfig> {
  try {
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      return { ...getDefaultConfig(), ...config };
    }
  } catch (error) {
    console.warn('Error loading database config:', error);
  }
  return getDefaultConfig();
}

async function saveConfig(config: DatabaseConfig): Promise<void> {
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const config = await loadConfig();
      return res.status(200).json({
        success: true,
        config
      });
    }

    if (req.method === 'POST') {
      const { action, ...data } = req.body;

      switch (action) {
        case 'add':
          {
            const { id, name, uri, description } = data;
            
            if (!id || !name || !uri) {
              return res.status(400).json({
                success: false,
                message: 'ID, name, and URI are required'
              });
            }

            const config = await loadConfig();
            config.databases[id] = { name, uri, description: description || '' };
            await saveConfig(config);

            return res.status(200).json({
              success: true,
              message: 'Database configuration added successfully',
              config
            });
          }

        case 'switch':
          {
            const { databaseId } = data;
            
            if (!databaseId) {
              return res.status(400).json({
                success: false,
                message: 'Database ID is required'
              });
            }

            const config = await loadConfig();
            
            if (!config.databases[databaseId]) {
              return res.status(400).json({
                success: false,
                message: 'Database configuration not found'
              });
            }

            config.current = databaseId;
            await saveConfig(config);

            return res.status(200).json({
              success: true,
              message: `Switched to database: ${config.databases[databaseId].name}`,
              config
            });
          }

        case 'remove':
          {
            const { databaseId } = data;
            
            if (!databaseId) {
              return res.status(400).json({
                success: false,
                message: 'Database ID is required'
              });
            }

            const config = await loadConfig();
            
            if (databaseId === 'primary') {
              return res.status(400).json({
                success: false,
                message: 'Cannot remove primary database'
              });
            }

            if (config.current === databaseId) {
              config.current = 'primary';
            }

            delete config.databases[databaseId];
            await saveConfig(config);

            return res.status(200).json({
              success: true,
              message: 'Database configuration removed successfully',
              config
            });
          }

        case 'test':
          {
            const { uri } = data;
            
            if (!uri) {
              return res.status(400).json({
                success: false,
                message: 'Database URI is required'
              });
            }

            // Test connection (simplified check)
            try {
              const mongoose = require('mongoose');
              const testConnection = await mongoose.createConnection(uri);
              await testConnection.close();

              return res.status(200).json({
                success: true,
                message: 'Database connection test successful'
              });
            } catch (error) {
              return res.status(400).json({
                success: false,
                message: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action'
          });
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Database config API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 