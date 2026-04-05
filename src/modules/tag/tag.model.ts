import { Schema, model, type Model } from 'mongoose';

import {
  CUSTOMER_TAG_DISCOUNT_TYPE,
  type CustomerTag
} from '@modules/tag/tag.types';

export type CustomerTagModel = Model<CustomerTag>;

const CustomerTagSchema = new Schema<CustomerTag>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    discountType: {
      type: String,
      enum: Object.values(CUSTOMER_TAG_DISCOUNT_TYPE),
      default: CUSTOMER_TAG_DISCOUNT_TYPE.NONE,
      required: true
    },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    priority: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CustomerTagSchema.index({ brandId: 1, outletId: 1 });
CustomerTagSchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    collation: { locale: 'en', strength: 2 }
  }
);
CustomerTagSchema.index(
  { brandId: 1, outletId: 1, priority: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);
CustomerTagSchema.index({ brandId: 1, outletId: 1, name: 'text' });

export const CustomerTagEntity = model<CustomerTag, CustomerTagModel>(
  'CustomerTag',
  CustomerTagSchema,
  'customer_tags'
);

export default CustomerTagEntity;
