import type { Dietary } from '@shared/enum';

import type { Types } from 'mongoose';

export interface MenuItemAddonInputCreate {
  addonId: string;
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
}

export interface MenuItemAddonInputUpdate extends MenuItemAddonInputCreate {
  allowedItems?: string[];
}

export interface MenuItemCreateDTO {
  name: string;
  shortCodes?: string[];
  categoryId: string;

  dietary: Dietary;

  basePrice?: number | null;
  costPrice?: number;

  online?: boolean;
  takeAway?: boolean;
  dineIn?: boolean;

  variations?: Array<{
    variationId: string;
    basePrice: number;
    costPrice?: number;
    addons?: MenuItemAddonInputCreate[];
  }>;
  addons?: MenuItemAddonInputCreate[];

  isActive?: boolean;
}

export interface MenuItem {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;

  name: string;
  shortCodes?: string[];
  categoryId: Types.ObjectId;

  dietary: Dietary;

  basePrice?: number | null;
  costPrice?: number;

  isVariation: boolean;

  online: boolean;
  takeAway: boolean;
  dineIn: boolean;

  isActive: boolean;
  isDelete: boolean;
}

export interface MenuItemUpdateDTO {
  name?: string;
  shortCodes?: string[];
  categoryId?: string;

  dietary?: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;

  online?: boolean;
  takeAway?: boolean;
  dineIn?: boolean;

  variations?: Array<{
    variationId: string;
    addons?: MenuItemAddonInputUpdate[];
  }>;
  addons?: MenuItemAddonInputUpdate[];

  isActive?: boolean;
}
