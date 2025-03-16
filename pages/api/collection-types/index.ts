import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import CollectionType, { ICollectionType } from '../../../models/CollectionType';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const collectionTypes = await CollectionType.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, data: collectionTypes });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'POST':
      try {
        const collectionType = await CollectionType.create(req.body);
        res.status(201).json({ success: true, data: collectionType });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
} 