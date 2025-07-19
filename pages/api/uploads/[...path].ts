import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path: filePath } = req.query;
  
  if (!filePath || !Array.isArray(filePath)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  // Construct the file path
  const fileName = filePath.join('/');
  const fullPath = path.join(process.cwd(), 'public', 'uploads', fileName);

  // Security check: ensure the path is within the uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fullPath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    // Get file stats
    const stats = fs.statSync(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ error: 'Failed to serve file' });
  }
}