import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export enum TABLE_STATUS {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED'
}

export interface TableCreateDTO {
  name: string;
  capacity?: number;
  zoneId?: string;
  status?: TABLE_STATUS;
  isActive?: boolean;
}

export interface TableUpdateDTO {
  name?: string;
  capacity?: number;
  zoneId?: string;
  status?: TABLE_STATUS;
  isActive?: boolean;
}

export interface TableStatusUpdateDTO {
  status: TABLE_STATUS;
}

export interface TableListQuery extends PaginationQuery {
  isActive?: boolean;
  zoneId?: string;
  status?: TABLE_STATUS;
  search?: string;
}

export interface Table {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  zoneId?: Types.ObjectId;

  name: string;
  capacity: number;
  status: TABLE_STATUS;

  currentOrderId?: Types.ObjectId | string | null;

  isActive: boolean;
  isDelete: boolean;
}
