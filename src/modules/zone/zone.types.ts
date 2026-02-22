import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export interface ZoneCreateDTO {
  name: string;
  isActive?: boolean;
}

export interface ZoneUpdateDTO {
  name?: string;
  isActive?: boolean;
}

export interface ZoneListQuery extends PaginationQuery {
  isActive?: boolean;
  search?: string;
}

export interface Zone {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;

  name: string;

  isActive: boolean;
  isDelete: boolean;
}
