import type { Types } from 'mongoose';

export interface MenuItemVariantCreateDTO {
  menuItemId: string;
  variationId: string;
  price: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface MenuItemVariantUpdateDTO {
  price?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface MenuItemVariant {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  menuItemId: Types.ObjectId;
  variationId: Types.ObjectId;
  price: number;
  isActive: boolean;
  isDelete: boolean;
  isDefault: boolean;
}
