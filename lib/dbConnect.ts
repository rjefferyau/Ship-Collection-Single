import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Global variable to maintain connection across hot reloads
let cachedConnection: any = null;

async function dbConnect() {
  // If we already have a connection, use it
  if (cachedConnection) {
    return cachedConnection;
  }

  // Create a new connection
  const connection = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  // Cache the connection
  cachedConnection = connection;
  
  return connection;
}

export default dbConnect; 