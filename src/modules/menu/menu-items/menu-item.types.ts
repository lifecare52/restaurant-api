import type { Dietary } from '@shared/enum';
import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export interface MenuItemAddonInputCreate {
  addonId: string;
  isSingleSelect?: boolean;
  min?: number | null;
  max?: number | null;
}

export interface MenuItemAddonInputUpdate extends MenuItemAddonInputCreate {
  allowedItemsId?: string[];
}

export interface MenuItemAddonView {
  name: string;
  items: unknown[];
  isSingleSelect: boolean;
  min?: number | null;
  max?: number | null;
  _id: Types.ObjectId;
}

export interface MeasurementConfig {
  measurementId: string;
  basePrice: number;
  costPrice?: number | null;
  baseValue?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  stepValue?: number | null;
  baseUnit: string;
}

export interface MenuItemCreateDTO {
  name: string;
  shortCodes?: string[];
  categoryId: string;
  taxGroupId?: string;

  dietary: Dietary;

  basePrice?: number | null;
  costPrice?: number;

  online?: boolean;
  takeAway?: boolean;
  dineIn?: boolean;

  isMeasurementBased?: boolean;
  measurementConfig?: MeasurementConfig;

  variations?: Array<{
    variationId: string;
    basePrice?: number;
    costPrice?: number;
    isMeasurementBased?: boolean;
    measurementConfig?: MeasurementConfig;
    addons?: MenuItemAddonInputCreate[];
  }>;
  addons?: MenuItemAddonInputCreate[];

  isActive?: boolean;
}

export interface MenuItemListQuery extends PaginationQuery {
  categoryId?: string;
}

export interface MenuItem {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;

  name: string;
  shortCodes?: string[];
  categoryId: Types.ObjectId;
  taxGroupId?: Types.ObjectId;

  dietary: Dietary;

  basePrice?: number | null;
  costPrice?: number;

  isVariation: boolean;

  online: boolean;
  takeAway: boolean;
  dineIn: boolean;

  isMeasurementBased: boolean;
  measurementConfig?: MeasurementConfig;

  isActive: boolean;
  isDelete: boolean;
}

export interface MenuItemUpdateDTO {
  name?: string;
  shortCodes?: string[];
  categoryId?: string;
  taxGroupId?: string;

  dietary?: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;

  online?: boolean;
  takeAway?: boolean;
  dineIn?: boolean;

  isMeasurementBased?: boolean;
  measurementConfig?: MeasurementConfig;

  variations?: Array<{
    id?: string;
    variationId: string;
    basePrice?: number;
    costPrice?: number;
    isMeasurementBased?: boolean;
    measurementConfig?: MeasurementConfig;
    addons?: MenuItemAddonInputUpdate[];
  }>;
  addons?: MenuItemAddonInputUpdate[];

  isActive?: boolean;
}

export interface BulkUpdateAvailabilityDTO {
  _id: string;
  online: boolean;
  takeAway: boolean;
  dineIn: boolean;
}
