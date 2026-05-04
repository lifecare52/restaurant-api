import { Schema, model, type Model, Types } from 'mongoose';

export interface Brand {
  name: string;
  ownerId?: Types.ObjectId;
  plan?: {
    name: string;
    outletLimit: number;
  };
  isActive: boolean;
  isDelete: boolean;
}

export type BrandModel = Model<Brand>;

const BrandSchema = new Schema<Brand>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, required: false, index: true },
    plan: {
      name: { type: String },
      outletLimit: { type: Number, default: 10 }
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const BrandEntity = model<Brand, BrandModel>('Brand', BrandSchema);
export default BrandEntity;
