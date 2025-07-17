import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    console.log('Starting cleanup of originalId fields...');
    
    // Count documents with originalId field
    const countWithOriginalId = await Starship.countDocuments({ originalId: { $exists: true } });
    console.log(`Found ${countWithOriginalId} documents with originalId field`);
    
    // Remove originalId field from all documents
    const result = await Starship.updateMany(
      { originalId: { $exists: true } },
      { $unset: { originalId: "" } }
    );
    
    console.log(`Cleanup complete: Modified ${result.modifiedCount} documents`);
    
    // Verify cleanup
    const remainingWithOriginalId = await Starship.countDocuments({ originalId: { $exists: true } });
    
    return res.status(200).json({
      success: true,
      message: 'Successfully cleaned up originalId fields',
      data: {
        documentsFound: countWithOriginalId,
        documentsModified: result.modifiedCount,
        remainingWithOriginalId: remainingWithOriginalId,
        cleanupComplete: remainingWithOriginalId === 0
      }
    });
    
  } catch (error: any) {
    console.error('Error during originalId cleanup:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error during cleanup' 
    });
  }
}