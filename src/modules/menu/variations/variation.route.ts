import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import { validateRequest } from '@shared/utils/validateRequest';

import {
  createVariationController,
  listVariationsController,
  getVariationController,
  updateVariationController,
  deleteVariationController,
} from './variation.controller';
import {
  createVariationSchema,
  updateVariationSchema,
  variationHeaderSchema,
  variationListQuerySchema,
  variationIdQuerySchema,
} from './variation.validator';

const router = Router();

router.post(
  '/variations',
  auth,
  validateRequest(variationHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createVariationSchema),
  createVariationController,
);

router.get(
  '/variations',
  auth,
  validateRequest(variationHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationListQuerySchema, 'query'),
  listVariationsController,
);

router.get(
  '/variations/detail',
  auth,
  validateRequest(variationHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationIdQuerySchema, 'query'),
  getVariationController,
);

router.patch(
  '/variations',
  auth,
  validateRequest(variationHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationIdQuerySchema, 'query'),
  validateRequest(updateVariationSchema),
  updateVariationController,
);

router.delete(
  '/variations',
  auth,
  validateRequest(variationHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationIdQuerySchema, 'query'),
  deleteVariationController,
);

export default router;
