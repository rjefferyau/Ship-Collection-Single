import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship, { IStarship } from '../../../models/Starship';

export interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate: string;
  retailPrice: number;
  purchasePrice: number;
  purchaseDate: string;
  owned: boolean;
  wishlist: boolean;
  wishlistPriority: number;
  imageUrl: string;
  magazinePdfUrl?: string;
  condition?: string;
  conditionNotes?: string;
  conditionPhotos?: string[];
  lastInspectionDate?: string;
  marketValue?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const starships = await Starship.find({});
        res.status(200).json({ success: true, data: starships });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case 'POST':
      try {
        const starship = await Starship.create(req.body);
        res.status(201).json({ success: true, data: starship });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
} 