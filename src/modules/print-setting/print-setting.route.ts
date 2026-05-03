import { Router } from 'express';
import { printSettingController } from './print-setting.controller';
import { printSettingValidator } from './print-setting.validator';
import { validateRequest } from '@shared/utils/validateRequest';
import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';
import { commonHeaderSchema } from '@shared/utils/common.validation';

const router = Router({ mergeParams: true });

const tenantMiddleware = [
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess
];

router.get(
  '/',
  ...tenantMiddleware,
  printSettingController.getSettings.bind(printSettingController)
);

router.put(
  '/',
  ...tenantMiddleware,
  validateRequest(printSettingValidator.updateSetting, 'body'),
  printSettingController.updateSettings.bind(printSettingController)
);

export default router;
