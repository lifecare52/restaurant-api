import { Schema, model, type Model } from 'mongoose';

import { VARIATION_DEPARTMENTS } from '@modules/menu/variations/variation.types';
import type { Variation } from '@modules/menu/variations/variation.types';

export type VariationModel = Model<Variation>;

const VariationSchema = new Schema<Variation>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },

    name: { type: String, required: true, trim: true },
    department: {
      type: String,
      enum: VARIATION_DEPARTMENTS,
      required: true
    },

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    taxGroupId: { type: Schema.Types.ObjectId, ref: 'TaxGroup', default: null }
  },
  { timestamps: true }
);

// Unique per brand+outlet+department+name (case-insensitive)
VariationSchema.index(
  { brandId: 1, outletId: 1, department: 1, name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
    partialFilterExpression: { isDelete: false }
  }
);

export const VariationEntity = model<Variation, VariationModel>(
  'Variation',
  VariationSchema,
  'variations'
);

export default VariationEntity;
