import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';
import Edition from '../../../models/Edition';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { franchise, editions, includeOwned, includeWishlist, includeOnOrder, includeNotOwned } = req.query;

    // Build the query
    const query: any = {};

    // Add franchise filter if provided
    if (franchise && franchise !== 'all') {
      query.franchise = franchise;
    }

    // Add editions filter if provided
    if (editions) {
      const editionArray = Array.isArray(editions) ? editions : editions.split(',');
      if (editionArray.length > 0 && !editionArray.includes('all')) {
        query.editionInternalName = { $in: editionArray };
      }
    }

    // Build status filter
    const statusConditions = [];
    if (includeOwned === 'true') {
      statusConditions.push({ owned: true });
    }
    if (includeWishlist === 'true') {
      statusConditions.push({ wishlist: true });
    }
    if (includeOnOrder === 'true') {
      statusConditions.push({ onOrder: true });
    }
    if (includeNotOwned === 'true') {
      statusConditions.push({ 
        $and: [
          { owned: false },
          { wishlist: false },
          { onOrder: false }
        ]
      });
    }

    // If any status filters are specified, add them to the query
    if (statusConditions.length > 0) {
      query.$or = statusConditions;
    }

    // Fetch starships with the query
    const starships = await Starship.find(query)
      .lean();

    // Sort by edition and then by issue number (convert to number for proper sorting)
    starships.sort((a, b) => {
      const editionCompare = (a.editionInternalName || a.edition || '').localeCompare(
        b.editionInternalName || b.edition || ''
      );
      if (editionCompare !== 0) return editionCompare;
      
      // Parse issue numbers for numeric sorting
      const issueA = parseInt(a.issue?.toString().replace(/\D/g, '') || '0', 10);
      const issueB = parseInt(b.issue?.toString().replace(/\D/g, '') || '0', 10);
      return issueA - issueB;
    });

    // Group starships by edition
    const groupedByEdition: Record<string, any> = {};
    
    for (const ship of starships) {
      const editionKey = ship.editionInternalName || ship.edition || 'Unknown Edition';
      
      if (!groupedByEdition[editionKey]) {
        // Try to get edition display name
        let displayName = ship.edition || editionKey;
        
        try {
          const editionDoc = await Edition.findOne({ internalName: editionKey }).lean();
          if (editionDoc && 'name' in editionDoc) {
            displayName = (editionDoc as any).name;
          }
        } catch (err) {
          // Fall back to the key if edition lookup fails
          console.log('Edition lookup failed for:', editionKey);
        }
        
        groupedByEdition[editionKey] = {
          editionName: displayName,
          editionInternalName: editionKey,
          ships: []
        };
      }
      
      groupedByEdition[editionKey].ships.push(ship);
    }

    // Convert to array and sort by edition name
    const editionGroups = Object.values(groupedByEdition)
      .sort((a: any, b: any) => a.editionName.localeCompare(b.editionName));

    // Calculate status counts for preview
    const statusCounts = {
      total: starships.length,
      owned: starships.filter(s => s.owned).length,
      wishlist: starships.filter(s => s.wishlist).length,
      onOrder: starships.filter(s => s.onOrder).length,
      notOwned: starships.filter(s => !s.owned && !s.wishlist && !s.onOrder).length
    };

    return res.status(200).json({
      success: true,
      data: {
        editionGroups,
        statusCounts,
        totalShips: starships.length
      }
    });
  } catch (error) {
    console.error('Error fetching checklist data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch checklist data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}