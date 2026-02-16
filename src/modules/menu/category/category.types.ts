import type { Types } from 'mongoose';

export interface CategoryCreateDTO {
  name: string;
  onlineName?: string;
  logo?: string;
  isActive?: boolean;
}

export interface CategoryUpdateDTO {
  name?: string;
  onlineName?: string;
  logo?: string;
  isActive?: boolean;
}

export interface Category {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  onlineName?: string;
  logo?: string;
  isActive: boolean;
  isDelete: boolean;
}
