import { Types } from 'mongoose';
import { PrintSetting } from './print-setting.model';
import type { PrintSettingUpdateDTO, IPrintSetting } from './print-setting.types';

export class PrintSettingService {
  /**
   * Get print settings for a specific outlet
   */
  async getSettings(brandId: string, outletId: string) {
    let settings = await PrintSetting.findOne({ 
      brandId: new Types.ObjectId(brandId), 
      outletId: new Types.ObjectId(outletId),
      isDelete: false
    });

    if (!settings) {
      // Create default settings if not found
      settings = await PrintSetting.create({
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId)
      });
    }

    return settings;
  }

  /**
   * Update print settings for a specific outlet
   */
  async updateSettings(brandId: string, outletId: string, updateData: PrintSettingUpdateDTO) {
    let settings = await PrintSetting.findOne({ 
      brandId: new Types.ObjectId(brandId), 
      outletId: new Types.ObjectId(outletId),
      isDelete: false
    });

    if (!settings) {
      settings = new PrintSetting({
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId)
      });
    }

    if (updateData.billPrinting) {
      settings.billPrinting = { ...settings.billPrinting, ...updateData.billPrinting } as any;
    }

    if (updateData.kotPrinting) {
      settings.kotPrinting = { ...settings.kotPrinting, ...updateData.kotPrinting } as any;
    }

    await settings.save();
    return settings;
  }
}

export const printSettingService = new PrintSettingService();
