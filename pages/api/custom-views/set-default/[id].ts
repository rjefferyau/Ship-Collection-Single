import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import CustomView from '../../../../models/CustomView';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  await dbConnect();

  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // First, unset any existing default view
    await CustomView.updateMany({}, { isDefault: false });
    
    // Then set the specified view as default
    const updatedView = await CustomView.findByIdAndUpdate(
      id, 
      { isDefault: true }, 
      { new: true }
    );
    
    if (!updatedView) {
      return res.status(404).json({ success: false, message: 'Custom view not found' });
    }
    
    return res.status(200).json({ success: true, data: updatedView });
    
  } catch (error) {
    console.error('Set default view API error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 