import express from 'express';
import swaggerUi from 'swagger-ui-express';

import brandRoutes from '@modules/brand/brand.route';
import measurementRoutes from '@modules/measurement/measurement.route';
import menuRoutes from '@modules/menu/menu.route';
import metaRoutes from '@modules/meta/meta.route';
import orderRoutes from '@modules/order/order.route';
import outletRoutes from '@modules/outlet/outlet.route';
import tableRoutes from '@modules/table/table.route';
import userRoutes from '@modules/user/user.route';
import zoneRoutes from '@modules/zone/zone.route';

import { getOpenApiSpec } from '@shared/docs/openapi';

import corsMiddleware from '@middlewares/cors.middleware';
import { notFoundHandler, errorHandler } from '@middlewares/error.middleware';
import responseMiddleware from '@middlewares/response.middleware';

/**
 * Application entrypoint (skeleton).
 * TODO: Register module routers when implemented.
 * TODO: Attach global middlewares (auth, error) once implemented.
 */
export const createApp = (): express.Express => {
  const app = express();
  // TODO: Add body parsers, CORS, logging, etc. when needed.
  app.use(corsMiddleware);
  app.use(express.json());
  app.get('/api-docs.json', (_req, res) => res.json(getOpenApiSpec()));
  app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(getOpenApiSpec()));
  app.use('/api/v1/brands', brandRoutes);
  app.use('/api/v1/meta', metaRoutes);
  app.use('/api/v1/brands', outletRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/measurements', measurementRoutes);
  app.use('/api/v1/menu', menuRoutes);
  app.use('/api/v1/order', orderRoutes);
  app.use('/api/v1/zones', zoneRoutes);
  app.use('/api/v1/tables', tableRoutes);
  app.use(responseMiddleware);
  app.use(notFoundHandler);
  app.use(errorHandler);
  app.use(responseMiddleware);
  return app;
};

export default createApp;
