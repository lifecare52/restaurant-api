import { Schema, model, type Model } from 'mongoose';

import type { MenuItem } from '@modules/menu/menu-items/menu-item.types';

import { DIETARIES } from '@shared/enum';

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
      enum: DIETARIES,
      required: true,
    },

    basePrice: { type: Number, default: null },
    costPrice: { type: Number, default: 0 },

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

export const MenuItemEntity = model<MenuItem, MenuItemModel>(
  'MenuItem',
  MenuItemSchema,
  'menu_items',
);

export default MenuItemEntity;
