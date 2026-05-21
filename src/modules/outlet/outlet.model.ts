import { Schema, model, type Model, Types } from 'mongoose';

import { GstScheme } from '@shared/enum';
import { KOT_GENERATION_MODE, PAYMENT_METHOD } from '@shared/enum/order.enum';

export interface Outlet {
  brandId: Types.ObjectId;
  basicInfo: {
    name: string;
    logo?: string;
    cuisineType?: string[];
    outletType: string;
  };
  contact: {
    email: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    address: string;
  };
  settings?: {
    gstEnabled: boolean;
    gstNo?: string;
    gstScheme: GstScheme;
    currency?: string;
    kotSettings?: {
      isKotEnabled: boolean;
      generationMode: KOT_GENERATION_MODE;
    };
    orderTypes?: {
      dineIn: { isEnabled: boolean };
      takeaway: { isEnabled: boolean };
      delivery: { isEnabled: boolean };
    };
    paymentSettings?: {
      allowedMethods: number[];
      isSplitPaymentEnabled: boolean;
    };
  };
  isActive: boolean;
  isDelete: boolean;
}

export type OutletModel = Model<Outlet>;

const OutletSchema = new Schema<Outlet>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    basicInfo: {
      name: { type: String, required: true, trim: true },
      logo: { type: String },
      cuisineType: [{ type: String }],
      outletType: { type: String, required: true, trim: true },
    },
    contact: {
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    settings: {
      gstEnabled: { type: Boolean, default: false },
      gstNo: { type: String, trim: true },
      gstScheme: {
        type: String,
        enum: Object.values(GstScheme),
        default: GstScheme.NONE,
      },
      currency: { type: String },
      kotSettings: {
        isKotEnabled: { type: Boolean, default: true },
        generationMode: {
          type: Number,
          enum: Object.values(KOT_GENERATION_MODE).filter(v => typeof v === 'number'),
          default: KOT_GENERATION_MODE.AUTO,
        },
      },
      orderTypes: {
        dineIn: {
          isEnabled: { type: Boolean, default: true },
        },
        takeaway: {
          isEnabled: { type: Boolean, default: true },
        },
        delivery: {
          isEnabled: { type: Boolean, default: true },
        },
      },
      paymentSettings: {
        allowedMethods: {
          type: [Number],
          enum: Object.values(PAYMENT_METHOD).filter(v => typeof v === 'number'),
          default: [
            PAYMENT_METHOD.CASH,
            PAYMENT_METHOD.CARD,
            PAYMENT_METHOD.UPI,
            PAYMENT_METHOD.WALLET,
            PAYMENT_METHOD.ONLINE,
          ],
        },
        isSplitPaymentEnabled: {
          type: Boolean,
          default: true,
        },
      },
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const OutletEntity = model<Outlet, OutletModel>('Outlet', OutletSchema);
export default OutletEntity;
