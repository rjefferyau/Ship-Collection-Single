import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'json2csv';
import dbConnect from '../../../lib/mongodb';
import Edition from '../../../models/Edition';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get all editions
    const editions = await Edition.find({}).lean();

    // Define CSV fields
    const fields = [
      'name',
      'internalName',
      'description',
      'retailPrice',
      'franchise',
      'isDefault'
    ];
    
    // Convert to CSV
    const csv = parse(editions, { fields });
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=editions.csv');
    
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to export editions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 