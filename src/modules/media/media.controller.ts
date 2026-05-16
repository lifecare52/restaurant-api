import { Request, Response, NextFunction } from 'express';
import { mediaService } from './media.service';

export class MediaController {
  public async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        return next({ status: 400, code: 'FILE_REQUIRED', message: 'No file uploaded' });
      }

      const uploadedBy = (req as any).user?.id || (req as any).user?._id;
      const outletId = req.headers['outlet-id'] as string;
      const entityId = req.headers['entity-id'] as string;

      const result = await mediaService.uploadMedia(req.file, {
        ...req.body,
        outletId,
        entityId,
        uploadedBy
      });

      res.locals.response = {
        status: true,
        code: 201,
        message: 'Media uploaded successfully',
        data: result
      };
      next();
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
