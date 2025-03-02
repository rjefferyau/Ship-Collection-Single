import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  if (method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Find the starship
    const starship = await Starship.findById(id);
    
    if (!starship) {
      return res.status(404).json({ success: false, error: 'Starship not found' });
    }
    
    // Toggle the owned status
    starship.owned = !starship.owned;
    
    // Save the updated starship
    await starship.save();
    
    res.status(200).json({ success: true, data: starship });
  } catch (error) {
    res.status(400).json({ success: false, error });
  }
} 