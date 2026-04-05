import { Router } from 'express';

import { tagController } from '@modules/tag/tag.controller';
import {
  createTagSchema,
  tagHeaderSchema,
  tagIdParamSchema,
  tagListQuerySchema,
  updateTagSchema
} from '@modules/tag/tag.validator';

import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router();

const tenantMiddleware = [
  auth,
  validateRequest(tagHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess
];

router.post('/', ...tenantMiddleware, validateRequest(createTagSchema), tagController.createTag);

router.get('/', ...tenantMiddleware, validateRequest(tagListQuerySchema, 'query'), tagController.getTags);

router.get(
  '/:id',
  ...tenantMiddleware,
  validateRequest(tagIdParamSchema, 'params'),
  tagController.getTagById
);

router.put(
  '/:id',
  ...tenantMiddleware,
  validateRequest(tagIdParamSchema, 'params'),
  validateRequest(updateTagSchema),
  tagController.updateTag
);

router.delete(
  '/:id',
  ...tenantMiddleware,
  validateRequest(tagIdParamSchema, 'params'),
  tagController.deleteTag
);

export default router;
