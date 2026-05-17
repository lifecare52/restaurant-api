import mongoose from 'mongoose';

import type { RequestHandler } from 'express';

const DB_READY_STATE_CONNECTED = 1;

export const requireDatabaseConnection: RequestHandler = (_req, _res, next) => {
  if (mongoose.connection.readyState === DB_READY_STATE_CONNECTED) {
    next();
    return;
  }

  next({
    status: 503,
    code: 'DATABASE_UNAVAILABLE',
    message: 'Database connection is unavailable. Please try again after MongoDB reconnects.'
  });
};

export default requireDatabaseConnection;
