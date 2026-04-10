import { Schema, model, type Model } from 'mongoose';

import type { Customer } from '@modules/customer/customer.types';

export type CustomerModel = Model<Customer>;

const CustomerSchema = new Schema<Customer>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, index: true, ref: 'Outlet' },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    mobile: { type: String, required: true, trim: true, index: true, match: /^[6-9]\d{9}$/ },
    email: { type: String, trim: true, lowercase: true, default: null },
    tags: [{ type: Schema.Types.ObjectId, ref: 'CustomerTag', default: [] }],
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    lastVisitAt: { type: Date, default: null },
    creditBalance: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    outletStats: [
      {
        outletId: { type: Schema.Types.ObjectId, ref: 'Outlet' },
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        lastVisitAt: { type: Date, default: null }
      }
    ]
  },
  { timestamps: true }
);

CustomerSchema.index(
  { brandId: 1, mobile: 1 },
  {
    unique: true,
    partialFilterExpression: { isDelete: false }
  }
);
CustomerSchema.index({ brandId: 1, name: 'text' });
CustomerSchema.index({ brandId: 1, tags: 1 });

export const CustomerEntity = model<Customer, CustomerModel>('Customer', CustomerSchema, 'customers');

export default CustomerEntity;
