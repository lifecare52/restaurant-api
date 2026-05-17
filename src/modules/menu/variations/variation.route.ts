import { Router } from 'express';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import {
  createVariationController,
  listVariationsController,
  listActiveVariationsController,
  getVariationController,
  updateVariationController,
  deleteVariationController,
} from './variation.controller';
import {
  createVariationSchema,
  updateVariationSchema,
  variationListQuerySchema,
  variationIdQuerySchema,
} from './variation.validator';

const router = Router();

router.post(
  '/variations',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createVariationSchema),
  createVariationController,
);

router.get(
  '/variations',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationListQuerySchema, 'query'),
  listVariationsController,
);

router.get(
  '/variations/active',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  listActiveVariationsController,
);

router.get(
  '/variations/detail',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationIdQuerySchema, 'query'),
  getVariationController,
);

router.patch(
  '/variations',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationIdQuerySchema, 'query'),
  validateRequest(updateVariationSchema),
  updateVariationController,
);

router.delete(
  '/variations',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(variationIdQuerySchema, 'query'),
  deleteVariationController,
);

export default router;
