import { Schema, model, type Model, Types } from 'mongoose';

export interface MenuItem {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;

  name: string;
  shortCodes?: string[];
  categoryId: Types.ObjectId;

  dietary: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;
  profitPercentage?: number;

  hasVariation: boolean;
  variationGroupIds?: Types.ObjectId[];
  addonGroupIds?: Types.ObjectId[];

  isActive: boolean;
  isDelete: boolean;
}

export type MenuItemModel = Model<MenuItem>;

const MenuItemSchema = new Schema<MenuItem>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true },

    name: { type: String, required: true, trim: true },
    shortCodes: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (arr: string[]) => arr.length <= 2,
          message: 'shortCodes can have at most 2 entries',
        },
        {
          validator: (arr: string[]) =>
            new Set((arr || []).map(s => (s ?? '').toLowerCase())).size === (arr || []).length,
          message: 'shortCodes must be unique (case-insensitive)',
        },
      ],
    },

    categoryId: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },

    dietary: {
      type: String,
      enum: ['VEG', 'NON_VEG', 'EGG'],
      required: true,
    },

    basePrice: { type: Number, default: null },
    costPrice: { type: Number, default: 0 },
    profitPercentage: { type: Number, default: 0 },

    hasVariation: { type: Boolean, default: false },
    variationGroupIds: [{ type: Schema.Types.ObjectId, ref: 'VariationGroup' }],
    addonGroupIds: [{ type: Schema.Types.ObjectId, ref: 'AddonGroup' }],

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MenuItemSchema.pre('save', function (next) {
  if (this.isModified('shortCodes')) {
    this.shortCodes = (this.shortCodes || [])
      .map(s => (s ?? '').trim())
      .filter(Boolean)
      .map(s => s.toUpperCase());
  }
  next();
});

MenuItemSchema.index({ brandId: 1, outletId: 1, name: 1 }, { unique: true });
MenuItemSchema.index(
  { brandId: 1, outletId: 1, shortCodes: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export const MenuItemEntity = model<MenuItem, MenuItemModel>('MenuItem', MenuItemSchema,'menu_items');

export default MenuItemEntity;
