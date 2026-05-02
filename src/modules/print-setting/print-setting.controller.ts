import type { Request, Response, NextFunction } from 'express';
import { PrintSettingService } from './print-setting.service';
import type { PrintSettingUpdateDTO } from './print-setting.types';

export class PrintSettingController {
  static async getSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = (req.headers['outlet-id'] as string) || '';
      const setting = await PrintSettingService.getPrintSetting(outletId);
      res.locals.response = {
        status: true,
        code: 200,
        message: 'Print settings retrieved successfully',
        data: setting
      };
      next();
    } catch (error) {
      next(error);
    }
  }

  static async upsertSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const brandId = (req.headers['brand-id'] as string) || '';
      const outletId = (req.headers['outlet-id'] as string) || '';
      const data = req.body as PrintSettingUpdateDTO;

      const setting = await PrintSettingService.upsertPrintSetting(brandId, outletId, data);

      res.locals.response = {
        status: true,
        code: 200,
        message: 'Print settings updated successfully',
        data: setting
      };
      next();
    } catch (error) {
      next(error);
    }
  }
}
