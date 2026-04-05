import { customerService } from '@modules/customer/customer.service';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

export class CustomerController {
  createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const customer = await customerService.createCustomer(brandId, outletId, req.body);

      res.locals.response = {
        status: true,
        code: 201,
        message: 'Customer created successfully',
        data: customer
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const customer = await customerService.updateCustomer(
        brandId,
        outletId,
        req.params.id,
        req.body
      );

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer updated successfully',
        data: customer
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const result = await customerService.getCustomers(brandId, outletId, req.query as any);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customers retrieved successfully',
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

  getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const customer = await customerService.getCustomerById(brandId, outletId, req.params.id);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer retrieved successfully',
        data: customer
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const customer = await customerService.deleteCustomer(brandId, outletId, req.params.id);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Customer deleted successfully',
        data: customer
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  assignTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const customer = await customerService.assignTags(
        brandId,
        outletId,
        req.params.id,
        req.body
      );

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Tags assigned successfully',
        data: customer
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  removeTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brandId, outletId } = getTenant(req);
      const customer = await customerService.removeTag(
        brandId,
        outletId,
        req.params.id,
        req.params.tagId
      );

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Tag removed successfully',
        data: customer
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const customerController = new CustomerController();
