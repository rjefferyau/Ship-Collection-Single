import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';

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
        const edition = await Edition.findById(id);
        if (!edition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        res.status(200).json({ success: true, data: edition });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'PUT':
      try {
        const edition = await Edition.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!edition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }
        res.status(200).json({ success: true, data: edition });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'DELETE':
      try {
        const deletedEdition = await Edition.findByIdAndDelete(id);
        if (!deletedEdition) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
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