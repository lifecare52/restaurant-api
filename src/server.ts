import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

import { createApp } from 'app';
import { connectDB } from 'config/db';

/**
 * Minimal server bootstrap (skeleton).
 * No business logic; only infrastructure placeholder for future expansion.
 */
const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

const start = async () => {
  const uri = process.env.MONGO_URI || '';
  if (!uri) {
    console.warn('MONGO_URI is not set, skipping DB connection');
  } else {
    await connectDB(uri);
    const shouldSync =
      (
        (process.env.SYNC_INDEXES ??
          (process.env.NODE_ENV && process.env.NODE_ENV !== 'production' ? 'true' : 'false')) ||
        ''
      ).toLowerCase() === 'true';
    if (shouldSync) {
      const names = mongoose.modelNames();
      for (const n of names) {
        try {
          await mongoose.model(n).syncIndexes();
        } catch {
          // ignore sync errors
        }
      }
    }
  }
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

void start();
