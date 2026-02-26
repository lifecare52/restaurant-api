import { Schema, model, type Model, Types } from 'mongoose';

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
    gstNo?: string;
    currency?: string;
    CGST?: number;
    SGST?: number;
  };
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
      gstNo: { type: String },
      currency: { type: String },
      CGST: { type: Number },
      SGST: { type: Number },
    },
  },
  { timestamps: true },
);

export const OutletEntity = model<Outlet, OutletModel>('Outlet', OutletSchema);
export default OutletEntity;
