import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Franchise from '../../../models/Franchise';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const franchise = await Franchise.findById(id);
        
        if (!franchise) {
          return res.status(404).json({ success: false, error: 'Franchise not found' });
        }
        
        res.status(200).json({ success: true, data: franchise });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
      
    case 'PUT':
      try {
        const franchise = await Franchise.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        
        if (!franchise) {
          return res.status(404).json({ success: false, error: 'Franchise not found' });
        }
        
        res.status(200).json({ success: true, data: franchise });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
      
    case 'DELETE':
      try {
        const deletedFranchise = await Franchise.findByIdAndDelete(id);
        
        if (!deletedFranchise) {
          return res.status(404).json({ success: false, error: 'Franchise not found' });
        }
        
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
      
    default:
      res.status(400).json({ success: false });
      break;
  }
} 