import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import CustomView from '../../../models/CustomView';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  await dbConnect();

  try {
    switch (req.method) {
      case 'GET':
        // Get a specific custom view
        const view = await CustomView.findById(id);
        if (!view) {
          return res.status(404).json({ success: false, message: 'Custom view not found' });
        }
        return res.status(200).json({ success: true, data: view });

      case 'PUT':
        // Update a custom view
        const updatedView = await CustomView.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        });
        
        if (!updatedView) {
          return res.status(404).json({ success: false, message: 'Custom view not found' });
        }
        
        return res.status(200).json({ success: true, data: updatedView });

      case 'DELETE':
        // Delete a custom view
        const deletedView = await CustomView.findByIdAndDelete(id);
        
        if (!deletedView) {
          return res.status(404).json({ success: false, message: 'Custom view not found' });
        }
        
        return res.status(200).json({ success: true, data: {} });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Custom view API error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 