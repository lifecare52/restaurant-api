import type { Dietary } from '@shared/enum';

import type { Types } from 'mongoose';

export interface AddonItemDTO {
  name: string;
  price: number;
  sapCode?: string;
  dietary?: Dietary;
  available?: boolean;
}

export interface AddonCreateDTO {
  name: string;
  items: AddonItemDTO[];
  isActive?: boolean;
}

export interface AddonUpdateDTO {
  name?: string;
  items?: AddonItemDTO[];
  isActive?: boolean;
}

export interface AddonItem {
  _id?: Types.ObjectId;
  name: string;
  price: number;
  sapCode?: string;
  dietary?: Dietary;
  available: boolean;
}

export interface Addon {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  items: AddonItem[];
  isActive: boolean;
  isDelete: boolean;
}
