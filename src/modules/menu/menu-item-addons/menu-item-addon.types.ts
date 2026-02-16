import type { Types } from 'mongoose';

export interface MenuItemAddonCreateDTO {
  menuItemId: string;
  addonId: string;
  allowedItemIds?: string[];
  menuItemVariantId?: string;
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
  isActive?: boolean;
}

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

export interface MenuItemAddonUpdateDTO {
  allowedItemIds?: string[];
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
  isActive?: boolean;
}
