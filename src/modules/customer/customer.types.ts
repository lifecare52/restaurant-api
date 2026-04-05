import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

import type { CustomerTag } from '@modules/tag/tag.types';

export interface Customer {
  _id?: Types.ObjectId;
  name: string;
  mobile: string;
  email?: string | null;
  tags: Array<Types.ObjectId | CustomerTag>;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  lastVisitAt?: Date | null;
  creditBalance: number;
  isActive: boolean;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCustomerDTO {
  name: string;
  mobile: string;
  email?: string | null;
  tags?: string[];
  loyaltyPoints?: number;
  creditBalance?: number;
  isActive?: boolean;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {}

export interface AssignCustomerTagsDTO {
  tagIds: string[];
}

export interface CustomerListQuery extends PaginationQuery {
  search?: string;
  tagId?: string;
  isActive?: boolean;
}
