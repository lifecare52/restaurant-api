import { Schema, model, type Model } from 'mongoose';

import type { MenuItemVariant } from '@modules/menu/menu-item-variants/menu-item-variant.types';

export type MenuItemVariantModel = Model<MenuItemVariant>;

const MenuItemVariantSchema = new Schema<MenuItemVariant>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true },
    menuItemId: { type: Schema.Types.ObjectId, required: true, index: true },
    variationId: { type: Schema.Types.ObjectId, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MenuItemVariantSchema.index(
  { brandId: 1, outletId: 1, menuItemId: 1, variationId: 1 },
  { unique: true },
);

MenuItemVariantSchema.index(
  { brandId: 1, outletId: 1, menuItemId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true, isDelete: false } },
);

export const MenuItemVariantEntity = model<MenuItemVariant, MenuItemVariantModel>(
  'MenuItemVariant',
  MenuItemVariantSchema,
  'menu_item_variants',
);

export default MenuItemVariantEntity;
