import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export const CUSTOMER_TAG_DISCOUNT_TYPE = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT: 'FLAT',
  NONE: 'NONE'
} as const;

export type CustomerTagDiscountType =
  (typeof CUSTOMER_TAG_DISCOUNT_TYPE)[keyof typeof CUSTOMER_TAG_DISCOUNT_TYPE];

export interface CustomerTag {
  _id?: Types.ObjectId;
  name: string;
  discountType: CustomerTagDiscountType;
  discountValue: number;
  minOrderAmount: number;
  priority: number;
  isActive: boolean;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCustomerTagDTO {
  name: string;
  discountType: CustomerTagDiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateCustomerTagDTO extends Partial<CreateCustomerTagDTO> {}

export interface CustomerTagListQuery extends PaginationQuery {
  search?: string;
  isActive?: boolean;
}
