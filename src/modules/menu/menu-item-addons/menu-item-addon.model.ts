import { Schema, model, Types } from 'mongoose';

export interface MenuItemAddon {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  menuItemId: Types.ObjectId;
  addonId: Types.ObjectId;
  menuItemVariantId?: Types.ObjectId;
  allowedItemIds?: Types.ObjectId[];
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
  isActive: boolean;
  isDelete: boolean;
}

const MenuItemAddonSchema = new Schema<MenuItemAddon>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true },
    menuItemId: { type: Schema.Types.ObjectId, required: true, index: true },
    addonId: { type: Schema.Types.ObjectId, required: true, index: true },
    menuItemVariantId: { type: Schema.Types.ObjectId, required: false, index: true },
    allowedItemIds: { type: [Schema.Types.ObjectId], default: [] },
    isSingleSelect: { type: Boolean, required: false },
    min: { type: Number, required: false },
    max: { type: Number, required: false },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MenuItemAddonSchema.index(
  { brandId: 1, outletId: 1, menuItemId: 1, addonId: 1 },
  { unique: true, partialFilterExpression: { isDelete: false, menuItemVariantId: { $exists: false } } },
);

MenuItemAddonSchema.index(
  { brandId: 1, outletId: 1, menuItemId: 1, addonId: 1, menuItemVariantId: 1 },
  { unique: true, partialFilterExpression: { isDelete: false, menuItemVariantId: { $type: 'objectId' } } },
);

const MenuItemAddonEntity = model<MenuItemAddon>('MenuItemAddon', MenuItemAddonSchema, 'menu_item_addons');
export default MenuItemAddonEntity;
