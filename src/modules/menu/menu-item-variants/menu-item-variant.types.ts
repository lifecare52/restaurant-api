import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { MeasurementConfig } from '@modules/menu/menu-items/menu-item.types';
import type { Types } from 'mongoose';

export interface MenuItemVariantCreateDTO {
  menuItemId: string;
  variationId: string;
  basePrice: number;
  costPrice?: number;

  // Measurement fields
  isMeasurementBased?: boolean;
  measurementConfig?: MeasurementConfig;

  isActive?: boolean;
  isDefault?: boolean;
}

export interface MenuItemVariantUpdateDTO {
  basePrice?: number;
  costPrice?: number;

  // Measurement fields
  isMeasurementBased?: boolean;
  measurementConfig?: MeasurementConfig;

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
  isDefault: boolean;
}
