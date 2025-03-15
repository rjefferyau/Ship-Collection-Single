import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '../../lib/mongodb';
import Starship from '../../models/Starship';
import Edition from '../../models/Edition';
import Faction from '../../models/Faction';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await dbConnect();

    // Get database connection information
    const connectionInfo = {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      readyStateText: getReadyStateText(mongoose.connection.readyState),
      models: Object.keys(mongoose.models),
    };

    // Get collection statistics
    const [starshipCount, editionCount, factionCount] = await Promise.all([
      Starship.countDocuments(),
      Edition.countDocuments(),
      Faction.countDocuments(),
    ]);

    // Get additional starship statistics
    const ownedStarships = await Starship.countDocuments({ owned: true });
    const wishlistStarships = await Starship.countDocuments({ wishlist: true });
    
    // Get storage statistics
    const dbStats = await mongoose.connection.db.stats();
    
    // Get collection details
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionDetails = await Promise.all(
      collections.map(async (collection) => {
        const stats = await mongoose.connection.db.collection(collection.name).stats();
        return {
          name: collection.name,
          documentCount: stats.count,
          size: stats.size,
          avgDocumentSize: stats.avgObjSize,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        connectionInfo,
        collections: collectionDetails,
        statistics: {
          starships: {
            total: starshipCount,
            owned: ownedStarships,
            wishlist: wishlistStarships,
          },
          editions: editionCount,
          factions: factionCount,
        },
        dbStats: {
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexSize: dbStats.indexSize,
          totalSize: dbStats.storageSize + dbStats.indexSize,
          avgObjSize: dbStats.avgObjSize,
        }
      }
    });
  } catch (error) {
    console.error('Database info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch database information',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper function to convert readyState number to text
function getReadyStateText(state: number): string {
  switch (state) {
    case 0: return 'Disconnected';
    case 1: return 'Connected';
    case 2: return 'Connecting';
    case 3: return 'Disconnecting';
    default: return 'Unknown';
  }
} 