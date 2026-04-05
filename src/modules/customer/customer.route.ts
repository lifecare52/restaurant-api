import { Router } from 'express';

import { customerController } from '@modules/customer/customer.controller';
import {
  assignCustomerTagsSchema,
  createCustomerSchema,
  customerHeaderSchema,
  customerIdParamSchema,
  customerListQuerySchema,
  customerTagParamSchema,
  updateCustomerSchema
} from '@modules/customer/customer.validator';

import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router();

const tenantMiddleware = [
  auth,
  validateRequest(customerHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess
];

router.post(
  '/',
  ...tenantMiddleware,
  validateRequest(createCustomerSchema),
  customerController.createCustomer
);

router.get(
  '/',
  ...tenantMiddleware,
  validateRequest(customerListQuerySchema, 'query'),
  customerController.getCustomers
);

router.get(
  '/:id',
  ...tenantMiddleware,
  validateRequest(customerIdParamSchema, 'params'),
  customerController.getCustomerById
);

router.put(
  '/:id',
  ...tenantMiddleware,
  validateRequest(customerIdParamSchema, 'params'),
  validateRequest(updateCustomerSchema),
  customerController.updateCustomer
);

router.delete(
  '/:id',
  ...tenantMiddleware,
  validateRequest(customerIdParamSchema, 'params'),
  customerController.deleteCustomer
);

router.post(
  '/:id/tags',
  ...tenantMiddleware,
  validateRequest(customerIdParamSchema, 'params'),
  validateRequest(assignCustomerTagsSchema),
  customerController.assignTags
);

router.delete(
  '/:id/tags/:tagId',
  ...tenantMiddleware,
  validateRequest(customerTagParamSchema, 'params'),
  customerController.removeTag
);

export default router;
