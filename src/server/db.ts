import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Use in-memory MongoDB if no URI is provided (perfect for zero-config preview)
    if (!mongoUri) {
      console.log('No MONGODB_URI found, starting in-memory MongoDB...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${mongoUri.substring(0, 30)}...`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
