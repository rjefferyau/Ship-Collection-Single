import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs-extra';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backupDir = path.join(process.cwd(), 'backups');

  if (req.method === 'GET') {
    try {
      // Ensure backup directory exists
      await fs.ensureDir(backupDir);
      
      // Read backup directory
      const files = await fs.readdir(backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.zip') && file.startsWith('backup-')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

          backups.push({
            filename: file,
            created: stats.mtime.toISOString(),
            size: `${sizeInMB} MB`,
            path: filePath,
            timestamp: file.replace('backup-', '').replace('.zip', '')
          });
        }
      }

      // Sort by creation time, newest first
      backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return res.status(200).json({
        success: true,
        backups: backups
      });

    } catch (error) {
      console.error('Error listing backups:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list backups',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { filename } = req.body;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      // Validate filename to prevent path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename'
        });
      }

      // Check if file exists and is a backup file
      if (!filename.endsWith('.zip') || !filename.startsWith('backup-')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup file'
        });
      }

      const filePath = path.join(backupDir, filename);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }

      await fs.remove(filePath);

      return res.status(200).json({
        success: true,
        message: 'Backup deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting backup:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}