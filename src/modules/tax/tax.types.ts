import { Types, type Document } from 'mongoose';

export const TAX_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT_AMOUNT: 'FLAT_AMOUNT',
} as const;

export type TaxType = (typeof TAX_TYPES)[keyof typeof TAX_TYPES];

export const TAX_CALCULATION_METHODS = {
  STANDARD: 'STANDARD',
  CUMULATIVE: 'CUMULATIVE',
} as const;

export type TaxCalculationMethod =
  (typeof TAX_CALCULATION_METHODS)[keyof typeof TAX_CALCULATION_METHODS];

export const ORDER_TYPES = {
  DINE_IN: 'DINE_IN',
  TAKE_AWAY: 'TAKE_AWAY',
  ONLINE: 'ONLINE',
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];

export interface Tax extends Document {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  rate: number;
  type: TaxType;
  isInclusive: boolean;
  calculationMethod: TaxCalculationMethod;
  applicableOrderTypes: OrderType[];
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaxGroup extends Document {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  taxes: Types.ObjectId[];
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
