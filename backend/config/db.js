import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import logger from '../utils/logger.js';
import { seedDatabase } from './seedData.js';

let mongod = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/apiforge';

  try {
    const sanitizedUri = uri.replace(/:([^@:]+)@/, ':****@');
    logger.info(`Attempting to connect to MongoDB at ${sanitizedUri}...`);
    // Attempt connecting to the configured MongoDB with 6s timeout for Atlas/cloud
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });
    logger.info(`MongoDB Connected successfully to instance: ${mongoose.connection.host}`);
  } catch (err) {
    logger.warn(`Could not connect to external MongoDB (${err.message}). Starting In-Memory MongoDB engine...`);

    try {
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'apiforge',
        },
      });
      const inMemoryUri = mongod.getUri();
      logger.info(`In-Memory MongoDB initialized at ${inMemoryUri}`);

      await mongoose.connect(inMemoryUri);
      logger.info(`Mongoose connected to In-Memory MongoDB database: ${mongoose.connection.host}`);
    } catch (memErr) {
      logger.error('Failed to start In-Memory MongoDB server:', memErr);
      throw memErr;
    }
  }

  // Auto-seed disabled - clean slate mode
  // (seedDatabase only run manually if requested)
};

export const closeDB = async () => {
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
};

export default connectDB;
