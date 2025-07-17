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
    const { backupFilename } = req.body;

    if (!backupFilename) {
      return res.status(400).json({
        success: false,
        message: 'Backup filename is required'
      });
    }

    // Validate backup filename
    if (!backupFilename.endsWith('.zip') || !backupFilename.startsWith('files-backup-')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file backup filename'
      });
    }

    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, backupFilename);

    // Check if backup file exists
    if (!await fs.pathExists(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'File backup not found'
      });
    }

    // Create a custom restore script with backup path
    const customRestoreScript = `
const FileRestore = require('${path.join(process.cwd(), 'scripts', 'restore-files.js')}');

const restore = new FileRestore({
  interactive: false,
  backupPath: '${backupPath}'
});

restore.run()
  .then((result) => {
    console.log('FILE_RESTORE_SUCCESS:', JSON.stringify(result));
    process.exit(0);
  })
  .catch((error) => {
    console.error('FILE_RESTORE_ERROR:', error.message);
    process.exit(1);
  });
    `;

    // Write temporary restore script
    const tempScriptPath = path.join(process.cwd(), 'temp-file-restore-script.js');
    await fs.writeFile(tempScriptPath, customRestoreScript);

    // Spawn restore process
    const restoreProcess = spawn('node', [tempScriptPath], {
      cwd: process.cwd(),
      env: process.env
    });

    let output = '';
    let errorOutput = '';

    // Handle stdout
    restoreProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // Check for success/error markers
      if (message.includes('FILE_RESTORE_SUCCESS:')) {
        const resultJson = message.substring(message.indexOf('FILE_RESTORE_SUCCESS:') + 21);
        try {
          const result = JSON.parse(resultJson);
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            success: true, 
            message: 'File restore completed successfully',
            result: result
          })}\n\n`);
        } catch (e) {
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            success: true, 
            message: 'File restore completed successfully'
          })}\n\n`);
        }
        return;
      }
      
      if (message.includes('FILE_RESTORE_ERROR:')) {
        const errorMessage = message.substring(message.indexOf('FILE_RESTORE_ERROR:') + 19);
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: false, 
          message: `File restore failed: ${errorMessage.trim()}`
        })}\n\n`);
        return;
      }
      
      // Send progress updates to client
      const lines = message.split('\n').filter((line: string) => line.trim());
      lines.forEach((line: string) => {
        if (line.trim() && !line.includes('FILE_RESTORE_')) {
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

      if (code === 0 && !output.includes('FILE_RESTORE_SUCCESS:')) {
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: true, 
          message: 'File restore completed successfully'
        })}\n\n`);
      } else if (code !== 0) {
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: false, 
          message: `File restore failed with exit code ${code}`,
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
        message: 'Failed to start file restore process',
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
    console.error('File restore API error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 