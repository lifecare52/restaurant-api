import { taxService } from '@modules/tax/tax.service';

import type { Request, Response, NextFunction } from 'express';

export class TaxController {
  // ==============================
  // individual taxes
  // ==============================

  createTax = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;

      const tax = await taxService.createTax(brandId, outletId, req.body);

      res.locals.response = {
        code: 201,
        status: true,
        message: 'Tax created successfully',
        data: tax,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getTaxes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;

      const result = await taxService.getTaxes(brandId, outletId, req.query as any);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Taxes retrieved successfully',
        meta: result.meta,
        data: result.data,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getTaxById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;
      const { taxId } = req.query as { taxId: string };

      const tax = await taxService.getTaxById(brandId, outletId, taxId);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax retrieved successfully',
        data: tax,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  updateTax = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;
      const { taxId } = req.query as { taxId: string };

      const tax = await taxService.updateTax(brandId, outletId, taxId, req.body);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax updated successfully',
        data: tax,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  deleteTax = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;
      const { taxId } = req.query as { taxId: string };

      await taxService.deleteTax(brandId, outletId, taxId);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax deleted successfully',
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  listActiveTaxes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;

      const taxes = await taxService.listActiveTaxes(brandId, outletId);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Active taxes retrieved successfully',
        data: taxes,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  // ==============================
  // tax groups
  // ==============================

  createTaxGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;

      const taxGroup = await taxService.createTaxGroup(brandId, outletId, req.body);

      res.locals.response = {
        code: 201,
        status: true,
        message: 'Tax Group created successfully',
        data: taxGroup,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getTaxGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;

      const result = await taxService.getTaxGroups(brandId, outletId, req.query as any);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax Groups retrieved successfully',
        meta: result.meta,
        data: result.data,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getTaxGroupById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;
      const { taxGroupId } = req.query as { taxGroupId: string };

      const taxGroup = await taxService.getTaxGroupById(brandId, outletId, taxGroupId);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax Group retrieved successfully',
        data: taxGroup,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  updateTaxGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;
      const { taxGroupId } = req.query as { taxGroupId: string };

      const taxGroup = await taxService.updateTaxGroup(brandId, outletId, taxGroupId, req.body);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax Group updated successfully',
        data: taxGroup,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  deleteTaxGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;
      const { taxGroupId } = req.query as { taxGroupId: string };

      await taxService.deleteTaxGroup(brandId, outletId, taxGroupId);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Tax Group deleted successfully',
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  listActiveTaxGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.headers['brand-id'] as string;
      const outletId = req.headers['outlet-id'] as string;

      const groups = await taxService.listActiveTaxGroups(brandId, outletId);

      res.locals.response = {
        code: 200,
        status: true,
        message: 'Active tax groups retrieved successfully',
        data: groups,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const taxController = new TaxController();
