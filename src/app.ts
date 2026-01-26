import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { notFoundHandler, errorHandler } from '@middlewares/error.middleware';
import responseMiddleware from '@middlewares/response.middleware';

import brandRoutes from '@modules/brand/brand.route';
import outletRoutes from '@modules/outlet/outlet.route';
import userRoutes from '@modules/user/user.route';

import { getOpenApiSpec } from '@shared/docs/openapi';

/**
 * Application entrypoint (skeleton).
 * TODO: Register module routers when implemented.
 * TODO: Attach global middlewares (auth, error) once implemented.
 */
export const createApp = (): express.Express => {
  const app = express();
  // TODO: Add body parsers, CORS, logging, etc. when needed.
  app.use(express.json());
  app.get('/api-docs.json', (_req, res) => res.json(getOpenApiSpec()));
  app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(getOpenApiSpec()));
  app.use('/api/v1/brands', brandRoutes);
  app.use('/api/v1/brands', outletRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use(responseMiddleware);
  app.use(notFoundHandler);
  app.use(errorHandler);
  app.use(responseMiddleware);
  return app;
};

export default createApp;
