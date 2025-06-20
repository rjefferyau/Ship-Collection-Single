import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import CustomView from '../../../models/CustomView';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  try {
    switch (req.method) {
      case 'GET':
        // Get all custom views
        const views = await CustomView.find({}).sort({ isDefault: -1, name: 1 });
        return res.status(200).json({ success: true, data: views });

      case 'POST':
        // Create a new custom view
        const newView = await CustomView.create(req.body);
        return res.status(201).json({ success: true, data: newView });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Custom views API error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 