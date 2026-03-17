import { Schema, model } from 'mongoose';

import type { MenuItemAddon } from '@modules/menu/menu-item-addons/menu-item-addon.types';

const MenuItemAddonSchema = new Schema<MenuItemAddon>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    menuItemId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'MenuItem' },
    addonId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Addon' },
    menuItemVariantId: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
      ref: 'MenuItemVariant'
    },
    allowedItemIds: { type: [Schema.Types.ObjectId], default: [] },
    isSingleSelect: { type: Boolean, default: false },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

MenuItemAddonSchema.index(
  { brandId: 1, outletId: 1, menuItemId: 1, addonId: 1, menuItemVariantId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDelete: false,
      menuItemVariantId: {
        $exists: false,
        $type: 'objectId'
      }
    }
  }
);

const MenuItemAddonEntity = model<MenuItemAddon>(
  'MenuItemAddon',
  MenuItemAddonSchema,
  'menu_item_addons'
);
export default MenuItemAddonEntity;
