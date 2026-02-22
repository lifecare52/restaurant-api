import type { Dietary } from '@shared/enum';
import type { PaginationQuery } from '@shared/interfaces/pagination';

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

export interface MeasurementConfig {
  measurementId: string;
  rate?: number;
  baseValue?: number;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
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

  // Measurement fields
  isMeasurementBased?: boolean;
  measurementConfig?: MeasurementConfig;

  variations?: Array<{
    variationId: string;
    basePrice: number;
    costPrice?: number;
    // Measurement fields for variation
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

  dietary: Dietary;

  basePrice?: number | null;
  costPrice?: number;

  isVariation: boolean;

  online: boolean;
  takeAway: boolean;
  dineIn: boolean;

  // Measurement fields
  isMeasurementBased: boolean;
  measurementId?: Types.ObjectId;
  rate?: number;
  baseValue?: number;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;

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

  // Measurement fields
  isMeasurementBased?: boolean;
  measurementConfig?: MeasurementConfig;

  variations?: Array<{
    variationId: string;
    basePrice?: number;
    costPrice?: number;
    // Measurement fields for variation
    isMeasurementBased?: boolean;
    measurementConfig?: MeasurementConfig;

    addons?: MenuItemAddonInputUpdate[];
  }>;
  addons?: MenuItemAddonInputUpdate[];

  isActive?: boolean;
}
