import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Manufacturer from '../../../models/Manufacturer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const manufacturers = await Manufacturer.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, data: manufacturers });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        const manufacturer = await Manufacturer.create(req.body);
        res.status(201).json({ success: true, data: manufacturer });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
      break;
  }
} 