import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

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
        const starship = await Starship.findById(id);
        if (!starship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
        }
        res.status(200).json({ success: true, data: starship });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'PUT':
      try {
        const starship = await Starship.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!starship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
        }
        res.status(200).json({ success: true, data: starship });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'DELETE':
      try {
        const deletedStarship = await Starship.findByIdAndDelete(id);
        if (!deletedStarship) {
          return res.status(404).json({ success: false, error: 'Starship not found' });
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