import { Schema, model, type Model } from 'mongoose';

import type { Category } from '@modules/menu/category/category.types';

export type CategoryModel = Model<Category>;

const CategorySchema = new Schema<Category>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    name: { type: String, required: true, trim: true },
    onlineName: { type: String, trim: true },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    taxGroupId: { type: Schema.Types.ObjectId, ref: 'TaxGroup', default: null }
  },
  { timestamps: true }
);

CategorySchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } }
);

export const CategoryEntity = model<Category, CategoryModel>('Category', CategorySchema);
export default CategoryEntity;
