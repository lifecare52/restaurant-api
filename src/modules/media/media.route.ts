import { Router } from 'express';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';
import { uploadMiddleware } from '@middlewares/upload.middleware';

import { mediaController } from './media.controller';
import { uploadMediaSchema } from './media.validator';

export const mediaRouter = Router();

// Rate limiting should be added here in the future
mediaRouter.post(
  '/upload',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  uploadMiddleware.single('file'),
  validateRequest(uploadMediaSchema, 'body'),
  mediaController.upload,
);

export default mediaRouter;
