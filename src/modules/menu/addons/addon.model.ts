import { Schema, model } from 'mongoose';

import type { Addon, AddonItem } from '@modules/menu/addons/addon.types';

import { DIETARIES } from '@shared/enum';

const AddonItemSchema = new Schema<AddonItem>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  sapCode: { type: String, trim: true },
  dietary: { type: String, enum: DIETARIES },
  available: { type: Boolean, default: true },
});

const AddonSchema = new Schema<Addon>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    name: { type: String, required: true, trim: true },
    items: { type: [AddonItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    taxGroupId: { type: Schema.Types.ObjectId, ref: 'TaxGroup', default: null },
  },
  { timestamps: true },
);

AddonSchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDelete: false },
    collation: { locale: 'en', strength: 2 },
  },
);

const AddonEntity = model<Addon>('Addon', AddonSchema);
export default AddonEntity;
