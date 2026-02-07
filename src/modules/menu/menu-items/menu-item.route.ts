import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import {
    requireBrandAccess,
    requireOutletAccess
} from '@middlewares/guard.middleware';
import { validateRequest } from '@shared/utils/validateRequest';

import {
    createMenuItemController,
    deleteMenuItemController,
    getMenuItemController,
    listMenuItemsController,
    updateMenuItemController,
} from './menu-item.controller';
import {
    createMenuItemSchema,
    updateMenuItemSchema,
    menuItemListQuerySchema,
    menuItemIdQuerySchema,
    menuItemHeaderSchema,
} from './menu-item.validator';

const router = Router();

router.post(
    '/menu-items',
    auth,
    validateRequest(menuItemHeaderSchema, 'headers'),
    requireBrandAccess,
    requireOutletAccess,
    validateRequest(createMenuItemSchema),
    createMenuItemController,
);

router.get(
    '/menu-items',
    auth,
    validateRequest(menuItemHeaderSchema, 'headers'),
    requireBrandAccess,
    requireOutletAccess,
    validateRequest(menuItemListQuerySchema, 'query'),
    listMenuItemsController,
);

router.get(
    '/menu-items/detail',
    auth,
    validateRequest(menuItemHeaderSchema, 'headers'),
    requireBrandAccess,
    requireOutletAccess,
    validateRequest(menuItemIdQuerySchema, 'query'),
    getMenuItemController,
);

router.patch(
    '/menu-items',
    auth,
    validateRequest(menuItemHeaderSchema, 'headers'),
    requireBrandAccess,
    requireOutletAccess,
    validateRequest(menuItemIdQuerySchema, 'query'),
    validateRequest(updateMenuItemSchema),
    updateMenuItemController,
);

router.delete(
    '/menu-items',
    auth,
    validateRequest(menuItemHeaderSchema, 'headers'),
    requireBrandAccess,
    requireOutletAccess,
    validateRequest(menuItemIdQuerySchema, 'query'),
    deleteMenuItemController,
);

export default router;
