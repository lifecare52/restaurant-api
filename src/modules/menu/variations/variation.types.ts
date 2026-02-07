import type { Types } from 'mongoose';

export enum VariationDepartment {
  SIZE = 'SIZE',
  PORTION = 'PORTION',
  QUANTITY = 'QUANTITY',
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME',
  PACK = 'PACK',
  FLAVOR = 'FLAVOR',
  TOPPING = 'TOPPING',
  STYLE = 'STYLE',
  CUSTOM = 'CUSTOM',
}

export const VARIATION_DEPARTMENTS = Object.values(VariationDepartment) as readonly VariationDepartment[];
export type VariationDepartmentType = (typeof VARIATION_DEPARTMENTS)[number];

export interface VariationCreateDTO {
  name: string;
  department: VariationDepartmentType;
  isActive?: boolean;
}

export interface VariationUpdateDTO {
  name?: string;
  department?: VariationDepartmentType;
  isActive?: boolean;
}

export interface Variation {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  department: VariationDepartmentType;
  isActive: boolean;
  isDelete: boolean;
}
