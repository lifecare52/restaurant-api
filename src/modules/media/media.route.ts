import { Router } from 'express';
import { mediaController } from './media.controller';
import { uploadMiddleware } from '@middlewares/upload.middleware';
import { validateRequest } from '@shared/utils/validateRequest';
import { uploadMediaSchema } from './media.validator';

export const mediaRouter = Router();

// Rate limiting should be added here in the future
mediaRouter.post(
  '/upload',
  uploadMiddleware.single('file'),
  validateRequest(uploadMediaSchema, 'body'),
  mediaController.upload
);

export default mediaRouter;
