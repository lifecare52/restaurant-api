import { Router } from 'express';

import { taxController } from '@modules/tax/tax.controller';
import {
  createTaxSchema,
  updateTaxSchema,
  createTaxGroupSchema,
  updateTaxGroupSchema,
  taxHeaderSchema,
  taxListQuerySchema,
  taxGroupListQuerySchema,
  taxGetQuerySchema,
  taxGroupGetQuerySchema
} from '@modules/tax/tax.validator';

import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router();

router.use(auth);

// ==========================================
// 1. ACTIVE LIST ROUTES
// ==========================================
router.get(
  '/groups/active',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  taxController.listActiveTaxGroups
);

router.get(
  '/active',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  taxController.listActiveTaxes
);

// ==========================================
// 2. TAX GROUP ROUTES (QUERY PARAM ONLY)
// ==========================================

// Detail
router.get(
  '/groups/detail',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGroupGetQuerySchema, 'query'),
  taxController.getTaxGroupById
);

// Update
router.patch(
  '/groups',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGroupGetQuerySchema, 'query'),
  validateRequest(updateTaxGroupSchema),
  taxController.updateTaxGroup
);

// Delete
router.delete(
  '/groups',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGroupGetQuerySchema, 'query'),
  taxController.deleteTaxGroup
);

// List/Create (After specific detail/action routes if using same base path)
router.get(
  '/groups',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGroupListQuerySchema, 'query'),
  taxController.getTaxGroups
);

router.post(
  '/groups',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createTaxGroupSchema),
  taxController.createTaxGroup
);

// ==========================================
// 3. INDIVIDUAL TAX ROUTES (QUERY PARAM ONLY)
// ==========================================

// Detail
router.get(
  '/detail',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGetQuerySchema, 'query'),
  taxController.getTaxById
);

// Update
router.patch(
  '/',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGetQuerySchema, 'query'),
  validateRequest(updateTaxSchema),
  taxController.updateTax
);

// Delete
router.delete(
  '/',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxGetQuerySchema, 'query'),
  taxController.deleteTax
);

// List/Create
router.get(
  '/',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(taxListQuerySchema, 'query'),
  taxController.getTaxes
);

router.post(
  '/',
  validateRequest(taxHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createTaxSchema),
  taxController.createTax
);

export const TaxRoutes = router;
