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
    
    const { editionId } = req.query;
    
    if (!editionId) {
      return res.status(400).json({ success: false, error: 'Edition ID is required' });
    }

    // Get the edition details
    const edition = await Edition.findById(editionId);
    
    if (!edition) {
      return res.status(404).json({ success: false, error: 'Edition not found' });
    }

    // Create template data with 3 example ships
    const templateData = [
      {
        issue: '1',
        edition: edition.name,
        shipName: 'Example Ship 1',
        faction: 'Example Faction',
        releaseDate: '2024-03-15', // ISO format (YYYY-MM-DD)
        owned: false,
        wishlist: true,
        wishlistPriority: 1,
        retailPrice: edition.retailPrice || 0,
        description: 'Example description for ship 1'
      },
      {
        issue: '2',
        edition: edition.name,
        shipName: 'Example Ship 2',
        faction: 'Example Faction',
        releaseDate: '2024-03-15', // ISO format (YYYY-MM-DD)
        owned: false,
        wishlist: true,
        wishlistPriority: 2,
        retailPrice: edition.retailPrice || 0,
        description: 'Example description for ship 2'
      },
      {
        issue: '3',
        edition: edition.name,
        shipName: 'Example Ship 3',
        faction: 'Example Faction',
        releaseDate: '2024-03-15', // ISO format (YYYY-MM-DD)
        owned: false,
        wishlist: true,
        wishlistPriority: 3,
        retailPrice: edition.retailPrice || 0,
        description: 'Example description for ship 3'
      }
    ];

    // Define the fields for the CSV
    const fields = [
      'issue',
      'edition',
      'shipName',
      'faction',
      'releaseDate',
      'owned',
      'wishlist',
      'wishlistPriority',
      'retailPrice',
      'description'
    ];

    // Convert to CSV
    const csv = parse(templateData, { fields });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${edition.name}-template.csv"`);

    // Send the CSV
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
} 