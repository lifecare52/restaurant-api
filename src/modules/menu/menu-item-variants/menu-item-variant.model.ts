import { Schema, model, type Model } from 'mongoose';

import type { MenuItemVariant } from '@modules/menu/menu-item-variants/menu-item-variant.types';

export type MenuItemVariantModel = Model<MenuItemVariant>;

const MeasurementConfigSchema = new Schema(
  {
    measurementId: { type: Schema.Types.ObjectId, required: true, ref: 'Measurement' },
    basePrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, default: null },
    baseValue: { type: Number, min: 0, default: null },
    minValue: { type: Number, default: null },
    maxValue: { type: Number, default: null },
    stepValue: { type: Number, default: null },
  },
  { _id: false },
);

const MenuItemVariantSchema = new Schema<MenuItemVariant>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    menuItemId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'MenuItem' },
    variationId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Variation' },
    basePrice: { type: Number, required: false, min: 0 },
    costPrice: { type: Number, min: 0, default: 0 },

    isMeasurementBased: { type: Boolean, default: false },
    measurementConfig: { type: MeasurementConfigSchema, default: undefined },

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MenuItemVariantSchema.index(
  { brandId: 1, outletId: 1, menuItemId: 1, variationId: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } },
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
