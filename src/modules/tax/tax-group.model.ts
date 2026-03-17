import { Schema, model, type Model } from 'mongoose';

import type { TaxGroup } from '@modules/tax/tax.types';

export type TaxGroupModel = Model<TaxGroup>;

const TaxGroupSchema = new Schema<TaxGroup>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    name: { type: String, required: true, trim: true },

    taxes: [{ type: Schema.Types.ObjectId, ref: 'Tax' }],

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

TaxGroupSchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDelete: false },
    collation: { locale: 'en', strength: 2 }
  }
);

export const TaxGroupEntity = model<TaxGroup, TaxGroupModel>(
  'TaxGroup',
  TaxGroupSchema,
  'tax_groups'
);

export default TaxGroupEntity;
