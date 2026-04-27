import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

import type { CustomerTag } from '@modules/tag/tag.types';

export interface CustomerOutletStats {
  outletId: Types.ObjectId;
  totalOrders: number;
  totalSpent: number;
  lastVisitAt?: Date | null;
}

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
  dueBalance: number;
  isActive: boolean;
  isDelete: boolean;
  outletStats: CustomerOutletStats[];
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
  dueBalance?: number;
  isActive?: boolean;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {}

export interface AssignCustomerTagsDTO {
  tagIds: string[];
}

export interface CustomerListQuery extends PaginationQuery {
  searchText?: string;
  tagId?: string;
  isActive?: boolean;
}
