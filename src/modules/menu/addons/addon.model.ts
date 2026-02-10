import { Schema, model, Types } from 'mongoose';

export interface AddonItem {
  _id?: Types.ObjectId;
  name: string;
  price: number;
  sapCode?: string;
  dietary?: 'VEG' | 'NON_VEG' | 'EGG';
  available: boolean;
}

export interface Addon {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  items: AddonItem[];
  isActive: boolean;
  isDelete: boolean;
}

const AddonItemSchema = new Schema<AddonItem>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  sapCode: { type: String, trim: true },
  dietary: { type: String, enum: ['VEG', 'NON_VEG', 'EGG'] },
  available: { type: Boolean, default: true },
});

const AddonSchema = new Schema<Addon>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    items: { type: [AddonItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AddonSchema.index({ brandId: 1, outletId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDelete: false }, collation: { locale: 'en', strength: 2 } });

const AddonEntity = model<Addon>('Addon', AddonSchema);
export default AddonEntity;
