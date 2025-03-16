import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import CollectionType from '../../../models/CollectionType';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const collectionType = await CollectionType.findById(id);
        
        if (!collectionType) {
          return res.status(404).json({ success: false, error: 'Collection type not found' });
        }
        
        res.status(200).json({ success: true, data: collectionType });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
      
    case 'PUT':
      try {
        const collectionType = await CollectionType.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        
        if (!collectionType) {
          return res.status(404).json({ success: false, error: 'Collection type not found' });
        }
        
        res.status(200).json({ success: true, data: collectionType });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
      
    case 'DELETE':
      try {
        const deletedCollectionType = await CollectionType.findByIdAndDelete(id);
        
        if (!deletedCollectionType) {
          return res.status(404).json({ success: false, error: 'Collection type not found' });
        }
        
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
      
    default:
      res.status(400).json({ success: false });
      break;
  }
} 