import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Manufacturer from '../../../models/Manufacturer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const manufacturer = await Manufacturer.findById(id);
        if (!manufacturer) {
          return res.status(404).json({ success: false, error: 'Manufacturer not found' });
        }
        res.status(200).json({ success: true, data: manufacturer });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const manufacturer = await Manufacturer.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!manufacturer) {
          return res.status(404).json({ success: false, error: 'Manufacturer not found' });
        }
        res.status(200).json({ success: true, data: manufacturer });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const deletedManufacturer = await Manufacturer.findByIdAndDelete(id);
        if (!deletedManufacturer) {
          return res.status(404).json({ success: false, error: 'Manufacturer not found' });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
      break;
  }
} 