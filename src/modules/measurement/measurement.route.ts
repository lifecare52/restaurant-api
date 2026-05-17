import { Router } from 'express';

import { ROLES } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireRole } from '@middlewares/guard.middleware';

import {
  createMeasurementController,
  deleteMeasurementController,
  getMeasurementController,
  listMeasurementsController,
  updateMeasurementController,
} from './measurement.controller';
import {
  createMeasurementSchema,
  measurementIdSchema,
  measurementListQuerySchema,
  updateMeasurementSchema,
} from './measurement.validator';

const router = Router();

router.post(
  '/',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createMeasurementSchema),
  createMeasurementController,
);

router.get(
  '/',
  auth,
  validateRequest(measurementListQuerySchema, 'query'),
  listMeasurementsController,
);

router.get(
  '/detail',
  auth,
  validateRequest(measurementIdSchema, 'query'),
  getMeasurementController,
);

router.patch(
  '/',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(updateMeasurementSchema),
  updateMeasurementController,
);

router.delete(
  '/',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(measurementIdSchema, 'query'),
  deleteMeasurementController,
);

export default router;
