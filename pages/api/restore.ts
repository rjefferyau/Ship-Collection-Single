import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Set headers for streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { backupFilename, targetDatabaseUri } = req.body;

    if (!backupFilename) {
      return res.status(400).json({
        success: false,
        message: 'Backup filename is required'
      });
    }

    if (!targetDatabaseUri) {
      return res.status(400).json({
        success: false,
        message: 'Target database URI is required'
      });
    }

    // Validate backup filename
    if (!backupFilename.endsWith('.zip') || !backupFilename.startsWith('backup-')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup filename'
      });
    }

    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, backupFilename);

    // Check if backup file exists
    if (!await fs.pathExists(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    // Create a custom restore script with target database
    const customRestoreScript = `
const DatabaseRestore = require('${path.join(process.cwd(), 'scripts', 'restore-database.js')}');

class CustomRestore extends DatabaseRestore {
  constructor(options) {
    super(options);
    // Override the database URI with the target database
    this.mongoUri = '${targetDatabaseUri}';
    this.dbName = this.extractDbName(this.mongoUri);
  }
}

const restore = new CustomRestore({
  interactive: false,
  backupPath: '${backupPath}'
});

restore.run()
  .then((result) => {
    console.log('RESTORE_SUCCESS:', JSON.stringify(result));
    process.exit(0);
  })
  .catch((error) => {
    console.error('RESTORE_ERROR:', error.message);
    process.exit(1);
  });
    `;

    // Write temporary restore script
    const tempScriptPath = path.join(process.cwd(), 'temp-restore-script.js');
    await fs.writeFile(tempScriptPath, customRestoreScript);

    // Spawn restore process
    const restoreProcess = spawn('node', [tempScriptPath], {
      cwd: process.cwd(), // Ensure we're in the project root
      env: {
        ...process.env,
        MONGODB_URI: targetDatabaseUri
      }
    });

    let output = '';
    let errorOutput = '';

    // Handle stdout
    restoreProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // Check for success/error markers
      if (message.includes('RESTORE_SUCCESS:')) {
        const resultJson = message.substring(message.indexOf('RESTORE_SUCCESS:') + 16);
        try {
          const result = JSON.parse(resultJson);
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            success: true, 
            message: 'Restore completed successfully',
            result: result
          })}\n\n`);
        } catch (e) {
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            success: true, 
            message: 'Restore completed successfully'
          })}\n\n`);
        }
        return;
      }
      
      if (message.includes('RESTORE_ERROR:')) {
        const errorMessage = message.substring(message.indexOf('RESTORE_ERROR:') + 14);
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: false, 
          message: `Restore failed: ${errorMessage.trim()}`
        })}\n\n`);
        return;
      }
      
      // Send progress updates to client
      const lines = message.split('\n').filter((line: string) => line.trim());
      lines.forEach((line: string) => {
        if (line.trim() && !line.includes('RESTORE_')) {
          res.write(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: line.trim() 
          })}\n\n`);
        }
      });
    });

    // Handle stderr
    restoreProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      
      // Send error updates to client
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: message.trim() 
      })}\n\n`);
    });

    // Handle process completion
    restoreProcess.on('close', async (code) => {
      // Clean up temporary script
      try {
        await fs.remove(tempScriptPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp script:', cleanupError);
      }

      if (code === 0 && !output.includes('RESTORE_SUCCESS:')) {
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: true, 
          message: 'Restore completed successfully'
        })}\n\n`);
      } else if (code !== 0) {
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: false, 
          message: `Restore failed with exit code ${code}`,
          error: errorOutput
        })}\n\n`);
      }
      
      res.end();
    });

    // Handle process error
    restoreProcess.on('error', async (error) => {
      // Clean up temporary script
      try {
        await fs.remove(tempScriptPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp script:', cleanupError);
      }

      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        success: false, 
        message: 'Failed to start restore process',
        error: error.message
      })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', async () => {
      restoreProcess.kill();
      try {
        await fs.remove(tempScriptPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp script on disconnect:', cleanupError);
      }
    });

  } catch (error) {
    console.error('Restore API error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 