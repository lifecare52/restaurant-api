import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export interface MenuItemAddonCreateDTO {
  menuItemId: string;
  addonId: string;
  allowedItemIds?: string[];
  menuItemVariantId?: string;
  isSingleSelect?: boolean;
  min?: number | null;
  max?: number | null;
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
  min?: number | null;
  max?: number | null;
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
  min?: number | null;
  max?: number | null;
  isActive: boolean;
  isDelete: boolean;
}

export interface MenuItemAddonUpdateDTO {
  allowedItemIds?: string[];
  isSingleSelect?: boolean;
  min?: number | null;
  max?: number | null;
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

export interface MenuItemAddonSyncItemDTO {
  addonId?: string | null;
}

export interface MenuItemAddonSyncVariationDTO {
  menuItemVariantId: string;
  addons?: MenuItemAddonSyncItemDTO[];
}

export interface MenuItemAddonSyncDTO {
  brandId: string;
  outletId: string;
  menuItemId: string;
  isVariation: boolean;
  addons?: MenuItemAddonSyncItemDTO[];
  variations?: MenuItemAddonSyncVariationDTO[];
}
