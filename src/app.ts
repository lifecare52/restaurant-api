import express from 'express';
import swaggerUi from 'swagger-ui-express';

import brandRoutes from '@modules/brand/brand.route';
import customerRoutes from '@modules/customer/customer.route';
import kotRoutes from '@modules/kot/kot.route';
import measurementRoutes from '@modules/measurement/measurement.route';
import menuRoutes from '@modules/menu/menu.route';
import metaRoutes from '@modules/meta/meta.route';
import orderRoutes from '@modules/order/order.route';
import outletRoutes from '@modules/outlet/outlet.route';
import reportRoutes from '@modules/report/report.route';
import tagRoutes from '@modules/tag/tag.route';
import tableRoutes from '@modules/table/table.route';
import { TaxRoutes } from '@modules/tax/tax.route';
import userRoutes from '@modules/user/user.route';
import zoneRoutes from '@modules/zone/zone.route';

import { getOpenApiSpec } from '@shared/docs/openapi';

import corsMiddleware from '@middlewares/cors.middleware';
import { notFoundHandler, errorHandler } from '@middlewares/error.middleware';
import responseMiddleware from '@middlewares/response.middleware';

export const createApp = (): express.Express => {
  const app = express();
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
  app.use('/api/v1/taxes', TaxRoutes);
  app.use('/api/v1/kot', kotRoutes);
  app.use('/api/v1/report', reportRoutes);
  app.use('/api/v1/tags', tagRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use(responseMiddleware);
  app.use(notFoundHandler);
  app.use(errorHandler);
  app.use(responseMiddleware);
  return app;
};

export default createApp;
