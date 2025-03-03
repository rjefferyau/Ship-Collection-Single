import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'Edition name is required' });
  }

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const edition = await Edition.findOne({ name: name });
        
        if (!edition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        
        res.status(200).json({ success: true, data: edition });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.status(405).json({ success: false, error: 'Method not allowed' });
      break;
  }
} 