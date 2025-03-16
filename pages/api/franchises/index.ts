import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Franchise, { IFranchise } from '../../../models/Franchise';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const franchises = await Franchise.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, data: franchises });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'POST':
      try {
        const franchise = await Franchise.create(req.body);
        res.status(201).json({ success: true, data: franchise });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
} 