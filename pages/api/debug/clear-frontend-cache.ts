import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Set headers to clear all possible caches
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Clear-Site-Data', '"cache", "storage"');
    
    return res.status(200).json({
      success: true,
      message: 'Frontend cache clearing headers sent',
      instructions: [
        'Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)',
        'Clear browser localStorage and sessionStorage',
        'Click the orange "Force Refresh Data" button',
        'Or restart the browser entirely'
      ]
    });
    
  } catch (error: any) {
    console.error('Error clearing frontend cache:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error clearing frontend cache' 
    });
  }
}