import { Schema, model, Document, Types } from 'mongoose';
import type { IPrintSetting } from './print-setting.types';

export interface PrintSettingDocument extends IPrintSetting, Document {
  _id: Types.ObjectId;
}

const printSettingSchema = new Schema<PrintSettingDocument>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true
    },
    outletId: {
      type: Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true
    },
    billPrinting: {
      isEnabled: { type: Boolean, default: false },
      autoPrintOnSettlement: { type: Boolean, default: false },
      paperSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
      printMode: { type: String, enum: ['SILENT', 'PREVIEW'], default: 'PREVIEW' },
      printerName: { type: String, default: '' },
      header: {
        showLogo: { type: Boolean, default: false },
        restaurantName: { type: String, default: '' },
        address: { type: String, default: '' },
        contactNumber: { type: String, default: '' },
        taxNumber: { type: String, default: '' }
      },
      footer: {
        thankYouMessage: { type: String, default: 'Thank You! Visit Again' },
        termsAndConditions: { type: String, default: '' }
      },
      showQRCode: { type: Boolean, default: false },
      numberOfCopies: { type: Number, default: 1 }
    },
    kotPrinting: {
      isEnabled: { type: Boolean, default: false },
      autoPrintOnGeneration: { type: Boolean, default: false },
      paperSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
      printMode: { type: String, enum: ['SILENT', 'PREVIEW'], default: 'PREVIEW' },
      printerName: { type: String, default: '' },
      showOrderType: { type: Boolean, default: true },
      showWaiterName: { type: Boolean, default: true }
    },
    isDelete: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const PrintSetting = model<PrintSettingDocument>('PrintSetting', printSettingSchema);
