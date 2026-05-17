import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import mongoose from 'mongoose';

import { createApp } from 'app';
import { connectDB } from 'config/db';
import { initializeSocketServer } from 'socket/socket.server';

/**
 * Minimal server bootstrap (skeleton).
 * No business logic; only infrastructure placeholder for future expansion.
 */
const PORT = Number(process.env.PORT) || 3000;
const app = createApp();
const httpServer = createServer(app);
const io = initializeSocketServer(httpServer);
app.set('io', io);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
};

const start = async () => {
  const uri = process.env.MONGO_URI || '';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!uri) {
    console.warn('MONGO_URI is not set, skipping DB connection');
  } else {
    try {
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
    } catch (error) {
      const message = `MongoDB connection failed: ${getErrorMessage(error)}`;
      if (isProduction) {
        throw new Error(message);
      }

      console.warn(`${message}. Continuing without DB because NODE_ENV is not production.`);
    }
  }

  httpServer.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

void start().catch(error => {
  console.error(getErrorMessage(error));
  process.exit(1);
});
