import { tagService } from '@modules/tag/tag.service';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

export class TagController {
  createTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const tag = await tagService.createTag(brandId, outletId, req.body);

      res.locals.response = {
        status: true,
        code: 201,
        message: 'Customer tag created successfully',
        data: tag
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  updateTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const tag = await tagService.updateTag(brandId, outletId, req.params.id, req.body);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer tag updated successfully',
        data: tag
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const result = await tagService.getTags(brandId, outletId, req.query as any);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer tags retrieved successfully',
        data: {
          data: result.items,
          pagination: result.pagination
        }
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getTagById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const tag = await tagService.getTagById(brandId, outletId, req.params.id);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer tag retrieved successfully',
        data: tag
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const tag = await tagService.deleteTag(brandId, outletId, req.params.id);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer tag deleted successfully',
        data: tag
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const tagController = new TagController();
