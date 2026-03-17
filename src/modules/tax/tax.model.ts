import { Schema, model, type Model } from 'mongoose';

import { ORDER_TYPES, TAX_CALCULATION_METHODS, TAX_TYPES, type Tax } from '@modules/tax/tax.types';

export type TaxModel = Model<Tax>;

const TaxSchema = new Schema<Tax>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    name: { type: String, required: true, trim: true },

    rate: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: Object.values(TAX_TYPES),
      required: true,
      default: TAX_TYPES.PERCENTAGE
    },

    isInclusive: { type: Boolean, default: false },
    calculationMethod: {
      type: String,
      enum: Object.values(TAX_CALCULATION_METHODS),
      default: TAX_CALCULATION_METHODS.STANDARD
    },

    applicableOrderTypes: {
      type: [String],
      enum: Object.values(ORDER_TYPES),
      default: Object.values(ORDER_TYPES)
    },

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Ensure a tax with the same name isn't created twice per outlet unless deleted
TaxSchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDelete: false },
    collation: { locale: 'en', strength: 2 }
  }
);

export const TaxEntity = model<Tax, TaxModel>('Tax', TaxSchema, 'taxes');

export default TaxEntity;
