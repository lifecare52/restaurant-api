import { Router } from 'express';
import { PrintSettingController } from './print-setting.controller';
import { printSettingValidator } from './print-setting.validator';
import { validateRequest } from '@shared/utils/validateRequest';
import { auth } from '@middlewares/auth.middleware';
import { commonHeaderSchema } from '@shared/utils/common.validation';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router();

router.use(auth);
router.use(validateRequest(commonHeaderSchema, 'headers'));
router.use(requireBrandAccess);
router.use(requireOutletAccess);

router.get('/', PrintSettingController.getSetting);

router.put(
  '/',
  validateRequest(printSettingValidator.updateSetting),
  PrintSettingController.upsertSetting
);

export default router;
