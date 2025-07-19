import { NextApiRequest, NextApiResponse } from 'next';
import { Model, Document } from 'mongoose';
import dbConnect from './mongodb';
import { getImageUrl } from './imageHelper';

// Standard API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Error handler utility
const handleError = (error: any, res: NextApiResponse, modelName: string) => {
  console.error(`${modelName} API error:`, error);
  
  // Handle MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({ 
      success: false, 
      message: `${modelName} with this data already exists`,
      error: error.message 
    });
  }
  
  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map((err: any) => err.message);
    return res.status(400).json({ 
      success: false, 
      message: `Validation failed: ${validationErrors.join(', ')}`,
      error: error.message
    });
  }
  
  // Handle cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ${modelName} ID format`,
      error: error.message
    });
  }
  
  return res.status(500).json({ 
    success: false, 
    message: 'Server error', 
    error: error.message 
  });
};

// Generic CRUD operations
const handleGet = async <T extends Document>(
  model: Model<T>, 
  id: string, 
  res: NextApiResponse, 
  modelName: string
) => {
  let item = null;
  
  // Convert frontend string representation to ObjectId for database query
  try {
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(id);
    item = await model.findById(objectId);
  } catch (error: any) {
    // If ObjectId conversion fails, the ID format is invalid
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ${modelName} ID format`,
      error: error.message
    });
  }
  
  if (!item) {
    return res.status(404).json({ 
      success: false, 
      message: `${modelName} not found` 
    });
  }
  
  // Transform image URLs if this is a Starship
  const itemData = item.toJSON();
  const responseData = modelName === 'Starship' && (itemData as any).imageUrl ? {
    ...itemData,
    imageUrl: getImageUrl((itemData as any).imageUrl)
  } : itemData;
  
  return res.status(200).json({ success: true, data: responseData });
};

const handleUpdate = async <T extends Document>(
  model: Model<T>, 
  id: string, 
  updateData: any, 
  res: NextApiResponse, 
  modelName: string
) => {
  let updatedItem = null;
  
  // Convert frontend string representation to ObjectId for database query
  try {
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(id);
    updatedItem = await model.findByIdAndUpdate(
      objectId, 
      updateData, 
      {
        new: true,
        runValidators: true
      }
    );
  } catch (error: any) {
    // If ObjectId conversion fails, the ID format is invalid
    if (error.name === 'BSONError' || error.message.includes('ObjectId')) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid ${modelName} ID format`,
        error: error.message
      });
    }
    // Re-throw validation or other errors
    throw error;
  }
  
  if (!updatedItem) {
    return res.status(404).json({ 
      success: false, 
      message: `${modelName} not found` 
    });
  }
  
  // Transform image URLs if this is a Starship
  const updatedData = updatedItem.toJSON();
  const responseData = modelName === 'Starship' && (updatedData as any).imageUrl ? {
    ...updatedData,
    imageUrl: getImageUrl((updatedData as any).imageUrl)
  } : updatedData;
  
  return res.status(200).json({ success: true, data: responseData });
};

const handleDelete = async <T extends Document>(
  model: Model<T>, 
  id: string, 
  res: NextApiResponse, 
  modelName: string
) => {
  let deletedItem = null;
  
  // Convert frontend string representation to ObjectId for database query
  try {
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(id);
    deletedItem = await model.findByIdAndDelete(objectId);
  } catch (error: any) {
    // If ObjectId conversion fails, the ID format is invalid
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ${modelName} ID format`,
      error: error.message
    });
  }
  
  if (!deletedItem) {
    return res.status(404).json({ 
      success: false, 
      message: `${modelName} not found` 
    });
  }
  
  return res.status(200).json({ success: true, data: {} });
};

const handleList = async <T extends Document>(
  model: Model<T>, 
  res: NextApiResponse, 
  sortOptions: any = { name: 1 },
  modelName: string = ''
) => {
  const items = await model.find({}).sort(sortOptions);
  
  // Transform image URLs if this is a Starship list
  const responseData = modelName === 'Starship' ? items.map(item => {
    const itemData = item.toJSON();
    return (itemData as any).imageUrl ? {
      ...itemData,
      imageUrl: getImageUrl((itemData as any).imageUrl)
    } : itemData;
  }) : items;
  
  return res.status(200).json({ success: true, data: responseData });
};

const handleCreate = async <T extends Document>(
  model: Model<T>, 
  createData: any, 
  res: NextApiResponse
) => {
  const newItem = await model.create(createData);
  return res.status(201).json({ success: true, data: newItem });
};

// Generic API handler factory for individual resource routes (with ID)
export function createResourceApiHandler<T extends Document>(
  model: Model<T>, 
  modelName: string,
  options: {
    allowedMethods?: string[];
    customHandlers?: {
      get?: (model: Model<T>, id: string, req: NextApiRequest, res: NextApiResponse) => Promise<any>;
      put?: (model: Model<T>, id: string, req: NextApiRequest, res: NextApiResponse) => Promise<any>;
      delete?: (model: Model<T>, id: string, req: NextApiRequest, res: NextApiResponse) => Promise<any>;
    };
  } = {}
) {
  const { allowedMethods = ['GET', 'PUT', 'DELETE'], customHandlers = {} } = options;
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;
    
    if (typeof id !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    await dbConnect();

    try {
      if (!allowedMethods.includes(req.method!)) {
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
      }

      switch (req.method) {
        case 'GET':
          if (customHandlers.get) {
            return await customHandlers.get(model, id, req, res);
          }
          return await handleGet(model, id, res, modelName);
          
        case 'PUT':
          if (customHandlers.put) {
            return await customHandlers.put(model, id, req, res);
          }
          return await handleUpdate(model, id, req.body, res, modelName);
          
        case 'DELETE':
          if (customHandlers.delete) {
            return await customHandlers.delete(model, id, req, res);
          }
          return await handleDelete(model, id, res, modelName);
          
        default:
          return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
          });
      }
    } catch (error) {
      return handleError(error, res, modelName);
    }
  };
}

// Generic API handler factory for collection routes (no ID)
export function createCollectionApiHandler<T extends Document>(
  model: Model<T>, 
  modelName: string,
  options: {
    allowedMethods?: string[];
    sortOptions?: any;
    customHandlers?: {
      get?: (model: Model<T>, req: NextApiRequest, res: NextApiResponse) => Promise<any>;
      post?: (model: Model<T>, req: NextApiRequest, res: NextApiResponse) => Promise<any>;
    };
  } = {}
) {
  const { allowedMethods = ['GET', 'POST'], sortOptions = { name: 1 }, customHandlers = {} } = options;
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await dbConnect();

    try {
      if (!allowedMethods.includes(req.method!)) {
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
      }

      switch (req.method) {
        case 'GET':
          if (customHandlers.get) {
            return await customHandlers.get(model, req, res);
          }
          return await handleList(model, res, sortOptions, modelName);
          
        case 'POST':
          if (customHandlers.post) {
            return await customHandlers.post(model, req, res);
          }
          return await handleCreate(model, req.body, res);
          
        default:
          return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
          });
      }
    } catch (error) {
      return handleError(error, res, modelName);
    }
  };
}

export default {
  createResourceApiHandler,
  createCollectionApiHandler
}; 