import { PrintSetting } from './print-setting.model';
import type { IPrintSetting, PrintSettingUpdateDTO } from './print-setting.types';
import { Types } from 'mongoose';

export class PrintSettingService {
  /**
   * Get print settings for an outlet.
   * If not found, returns a default structured object.
   */
  static async getPrintSetting(outletId: string): Promise<IPrintSetting> {
    const setting = await PrintSetting.findOne({
      outletId: new Types.ObjectId(outletId),
      isDelete: false
    }).lean();

    if (!setting) {
      // Return a default object if no settings are saved yet
      return {
        brandId: new Types.ObjectId(), // This will be overwritten when saved
        outletId: new Types.ObjectId(outletId),
        billPrinting: {
          isEnabled: false,
          autoPrintOnSettlement: false,
          paperSize: '80mm',
          printMode: 'PREVIEW',
          printerName: '',
          header: {
            showLogo: false,
            restaurantName: '',
            address: '',
            contactNumber: '',
            taxNumber: ''
          },
          footer: {
            thankYouMessage: 'Thank You! Visit Again',
            termsAndConditions: ''
          },
          showQRCode: false,
          numberOfCopies: 1
        },
        kotPrinting: {
          isEnabled: false,
          autoPrintOnGeneration: false,
          paperSize: '80mm',
          printMode: 'PREVIEW',
          printerName: '',
          showOrderType: true,
          showWaiterName: true
        },
        isDelete: false
      } as IPrintSetting;
    }

    return setting;
  }

  /**
   * Update or create print settings for an outlet
   */
  static async upsertPrintSetting(
    brandId: string,
    outletId: string,
    data: PrintSettingUpdateDTO
  ): Promise<IPrintSetting> {
    const setting = await PrintSetting.findOne({
      outletId: new Types.ObjectId(outletId),
      isDelete: false
    });

    if (setting) {
      if (data.billPrinting) {
        setting.billPrinting = {
          ...setting.billPrinting,
          ...data.billPrinting,
          header: {
            ...setting.billPrinting?.header,
            ...data.billPrinting?.header
          },
          footer: {
            ...setting.billPrinting?.footer,
            ...data.billPrinting?.footer
          }
        };
      }
      if (data.kotPrinting) {
        setting.kotPrinting = {
          ...setting.kotPrinting,
          ...data.kotPrinting
        };
      }
      await setting.save();
      return setting.toObject();
    }

    // Create new
    const newSetting = new PrintSetting({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      ...data
    });
    await newSetting.save();
    return newSetting.toObject();
  }
}
