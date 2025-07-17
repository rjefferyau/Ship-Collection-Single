import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: unknown; promise: unknown };
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Connection options optimized for containerized environments
const CONNECTION_OPTIONS = {
  bufferCommands: false,
  // Connection pool settings for better performance
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // Retry logic for containerized environments
  retryWrites: true,
  retryReads: true,
  // Heartbeat settings
  heartbeatFrequencyMS: 10000,
  // Connection management
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 Connecting to MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    cached.promise = mongoose.connect(MONGODB_URI, CONNECTION_OPTIONS).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error);
      cached.promise = null; // Reset promise on failure
      throw error;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    cached.promise = null; // Reset promise on failure
    throw error;
  }
}

export default dbConnect; 