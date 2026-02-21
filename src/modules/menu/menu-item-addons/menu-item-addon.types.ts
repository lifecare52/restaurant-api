import type { PaginationQuery } from '@shared/interfaces/pagination';

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

export interface BulkMenuItemAddonItemDTO {
  menuId: string;
  variationId?: string;
}

export interface BulkMenuItemAddonCreateDTO {
  addonId: string;
  allowedItemsId?: string[];
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
  isActive?: boolean;
  items: BulkMenuItemAddonItemDTO[];
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

export type MenuItemAddonSortColumn = 'createdAt' | 'updatedAt' | 'isActive';

export interface MenuItemAddonListQuery extends PaginationQuery {
  column?: MenuItemAddonSortColumn;
}

export interface MenuItemAddonFilterQuery {
  menuItemId?: string;
  addonId?: string;
  menuItemVariantId?: string;
}
