import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Faction from '../../../models/Faction';

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
        const faction = await Faction.findById(id);
        if (!faction) {
          return res.status(404).json({ success: false, error: 'Faction not found' });
        }
        res.status(200).json({ success: true, data: faction });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'PUT':
      try {
        const faction = await Faction.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!faction) {
          return res.status(404).json({ success: false, error: 'Faction not found' });
        }
        res.status(200).json({ success: true, data: faction });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'DELETE':
      try {
        const deletedFaction = await Faction.findByIdAndDelete(id);
        if (!deletedFaction) {
          return res.status(404).json({ success: false, error: 'Faction not found' });
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