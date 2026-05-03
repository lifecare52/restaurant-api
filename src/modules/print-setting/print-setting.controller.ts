import { Request, Response, NextFunction } from 'express';
import { printSettingService } from './print-setting.service';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

export class PrintSettingController {
  /**
   * Get print settings
   * GET /api/v1/print-settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { brandId, outletId } = getTenant(req);
      
      const settings = await printSettingService.getSettings(brandId, outletId);
      
      res.locals.response = { status: true, code: 200, message: 'Print settings retrieved successfully', data: settings };
      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update print settings
   * PUT /api/v1/print-settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { brandId, outletId } = getTenant(req);
      const updateData = req.body;
      
      const settings = await printSettingService.updateSettings(brandId, outletId, updateData);
      
      res.locals.response = { status: true, code: 200, message: 'Print settings updated successfully', data: settings };
      next();
    } catch (error) {
      next(error);
    }
  }
}

export const printSettingController = new PrintSettingController();
