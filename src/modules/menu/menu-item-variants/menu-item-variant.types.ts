import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export interface MenuItemVariantCreateDTO {
  menuItemId: string;
  variationId: string;
  basePrice: number;
  costPrice?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface MenuItemVariantUpdateDTO {
  basePrice?: number;
  costPrice?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export type MenuItemVariantSortColumn =
  | 'basePrice'
  | 'costPrice'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive';

export interface MenuItemVariantListQuery extends PaginationQuery {
  menuItemId?: string;
  variationId?: string;
  column?: MenuItemVariantSortColumn;
}

export interface MenuItemVariant {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  menuItemId: Types.ObjectId;
  variationId: Types.ObjectId;
  basePrice: number;
  costPrice?: number;
  isActive: boolean;
  isDelete: boolean;
  isDefault: boolean;
}
