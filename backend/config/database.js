import mongoose from 'mongoose';
import { loadConfig } from './env.js';

export async function connectDatabase() {
  const { mongoUri } = loadConfig();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.info('Connected to MongoDB.');
}
