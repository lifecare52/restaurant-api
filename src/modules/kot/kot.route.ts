import { Router } from 'express';

import {
    listKOTsByOrderController,
    listAllKOTsController,
    updateKOTStatusController,
    updateKOTItemStatusController,
} from '@modules/kot/kot.controller';

import {
    updateKOTStatusSchema,
    updateKOTItemStatusSchema,
    kotListQuerySchema,
    kitchenDisplayQuerySchema,
} from '@modules/kot/kot.validator';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';
import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router({ mergeParams: true });

const tenantMiddleware = [
    auth,
    validateRequest(commonHeaderSchema, 'headers'),
    requireBrandAccess,
    requireOutletAccess,
];

// GET /kots?orderId=... — List KOTs for a specific order
router.get(
    '/',
    ...tenantMiddleware,
    validateRequest(kotListQuerySchema, 'query'),
    listKOTsByOrderController,
);

// GET /kots/kitchen?status=... — Kitchen Display System feed (all active KOTs)
router.get(
    '/kitchen',
    ...tenantMiddleware,
    validateRequest(kitchenDisplayQuerySchema, 'query'),
    listAllKOTsController,
);

// PATCH /kots/status — Update KOT-level status (with state-transition guard)
router.patch(
    '/status',
    ...tenantMiddleware,
    validateRequest(updateKOTStatusSchema, 'body'),
    updateKOTStatusController,
);

// PATCH /kots/item-status — Update individual item status within a KOT
router.patch(
    '/item-status',
    ...tenantMiddleware,
    validateRequest(updateKOTItemStatusSchema, 'body'),
    updateKOTItemStatusController,
);

export default router;
