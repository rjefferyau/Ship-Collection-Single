import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { internalName } = req.query;

  if (!internalName) {
    return res.status(400).json({ success: false, error: 'Internal name parameter is required' });
  }

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const edition = await Edition.findOne({ internalName });
        
        if (!edition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        
        res.status(200).json({ success: true, data: edition });
      } catch (error) {
        console.error('Error fetching edition by internal name:', error);
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        });
      }
      break;
    default:
      res.status(405).json({ success: false, error: 'Method not allowed' });
      break;
  }
} 