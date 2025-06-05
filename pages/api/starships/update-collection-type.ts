import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  const { editionInternalName, collectionType } = req.body;

  if (!editionInternalName || !collectionType) {
    return res.status(400).json({ success: false, message: 'editionInternalName and collectionType are required' });
  }

  try {
    const result = await Starship.updateMany(
      { editionInternalName },
      { $set: { collectionType } }
    );
    res.status(200).json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update collection type', error });
  }
} 