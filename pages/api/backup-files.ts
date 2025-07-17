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
    const scriptPath = path.join(process.cwd(), 'scripts', 'backup-files.js');
    
    // Check if backup script exists
    if (!await fs.pathExists(scriptPath)) {
      return res.status(500).json({ 
        success: false, 
        message: 'File backup script not found' 
      });
    }

    // Spawn backup process
    const backupProcess = spawn('node', [scriptPath], {
      cwd: process.cwd(),
      env: process.env
    });

    let output = '';
    let errorOutput = '';

    // Handle stdout
    backupProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // Send progress updates to client
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        message: message.trim() 
      })}\n\n`);
    });

    // Handle stderr
    backupProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      
      // Send error updates to client
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: message.trim() 
      })}\n\n`);
    });

    // Handle process completion
    backupProcess.on('close', (code) => {
      if (code === 0) {
        // Extract archive path from output
        const archiveMatch = output.match(/Archive: (.+\.zip)/);
        const archivePath = archiveMatch ? archiveMatch[1] : null;
        
        // Extract stats from output
        const totalFilesMatch = output.match(/Total files: (\d+)/);
        const totalSizeMatch = output.match(/Total size: ([\d.]+) MB/);
        const compressedSizeMatch = output.match(/Compressed size: ([\d.]+) MB/);
        
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: true,
          message: 'File backup completed successfully',
          archivePath: archivePath,
          stats: {
            totalFiles: totalFilesMatch ? parseInt(totalFilesMatch[1]) : null,
            totalSize: totalSizeMatch ? parseFloat(totalSizeMatch[1]) : null,
            compressedSize: compressedSizeMatch ? parseFloat(compressedSizeMatch[1]) : null
          }
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: false, 
          message: `File backup failed with exit code ${code}`,
          error: errorOutput
        })}\n\n`);
      }
      
      res.end();
    });

    // Handle process error
    backupProcess.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        success: false, 
        message: 'Failed to start file backup process',
        error: error.message
      })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      backupProcess.kill();
    });

  } catch (error) {
    console.error('File backup API error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 