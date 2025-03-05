import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { parse } from 'json2csv';
import dbConnect from '../../lib/mongodb';
import Starship, { IStarship } from '../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const format = req.query.format as string || 'json';
    
    // Get all starships
    const starships = await Starship.find({}).lean();

    if (format === 'json') {
      // Return as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=starship-collection.json');
      return res.status(200).json(starships);
    } else if (format === 'csv') {
      // Convert to CSV
      const fields = [
        '_id', 'issue', 'edition', 'shipName', 'faction', 
        'releaseDate', 'owned', 'wishlist', 'wishlistPriority', 
        'onOrder', 'pricePaid', 'orderDate', 'retailPrice',
        'purchasePrice', 'marketValue', 'condition', 'conditionNotes'
      ];
      
      const csv = parse(starships, { fields });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=starship-collection.csv');
      return res.status(200).send(csv);
    } else {
      return res.status(400).json({ message: 'Invalid export format. Use "json" or "csv".' });
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ message: 'Failed to export data', error: String(error) });
  }
} 