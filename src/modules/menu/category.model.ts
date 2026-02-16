import { Schema, model, type Model, Types } from 'mongoose';

export interface Category {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  onlineName?: string;
  logo?: string;
  isActive: boolean;
  isDelete: boolean;
}

export type CategoryModel = Model<Category>;

const CategorySchema = new Schema<Category>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    onlineName: { type: String, trim: true },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

CategorySchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } },
);

export const CategoryEntity = model<Category, CategoryModel>('Category', CategorySchema);
export default CategoryEntity;
