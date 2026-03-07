import type { Types } from 'mongoose';

export interface CategoryCreateDTO {
  name: string;
  onlineName?: string;
  logo?: string;
  isActive?: boolean;
  taxGroupId?: string;
}

export interface CategoryUpdateDTO {
  name?: string;
  onlineName?: string;
  logo?: string;
  isActive?: boolean;
  taxGroupId?: string;
}

export interface Category {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  onlineName?: string;
  logo?: string;
  isActive: boolean;
  isDelete: boolean;
  taxGroupId?: Types.ObjectId;
}
