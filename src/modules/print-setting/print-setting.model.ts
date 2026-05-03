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
      
      showLogo: { type: Boolean, default: false },
      showHeader: { type: Boolean, default: true },
      headerText: { type: String, default: 'Welcome to our restaurant!' },
      showFooter: { type: Boolean, default: true },
      footerText: { type: String, default: 'Thank You! Visit Again' },
      
      showCustomerDetails: { type: Boolean, default: false },
      showCaptainName: { type: Boolean, default: true },
      showCoverCount: { type: Boolean, default: false },
      showItemHsnCode: { type: Boolean, default: false },
      showDiscountDetails: { type: Boolean, default: true },
      
      showPaymentQrCode: { type: Boolean, default: false },
      merchantUpiId: { type: String, default: '' },
      showOrderType: { type: Boolean, default: true },
      
      numberOfCopies: { type: Number, default: 1 }
    },
    kotPrinting: {
      isEnabled: { type: Boolean, default: false },
      autoPrintOnGeneration: { type: Boolean, default: false },
      paperSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
      printMode: { type: String, enum: ['SILENT', 'PREVIEW'], default: 'PREVIEW' },
      printerName: { type: String, default: '' },
      
      showModifiers: { type: Boolean, default: true },
      itemWiseKOT: { type: Boolean, default: false },
      showCancelledItems: { type: Boolean, default: true },
      showTableToken: { type: Boolean, default: true },
      showWaiterName: { type: Boolean, default: true },
      showOrderType: { type: Boolean, default: true },
      showCoverCount: { type: Boolean, default: false }
    },
    isDelete: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const PrintSetting = model<PrintSettingDocument>('PrintSetting', printSettingSchema);
