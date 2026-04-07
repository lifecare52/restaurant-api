import type { OrderItem } from '@modules/order/order.types';

import { KOT_STATUS, KOT_TYPE, ITEM_STATUS } from '@shared/enum/order.enum';
import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export { KOT_STATUS, KOT_TYPE, ITEM_STATUS };

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface KOT {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderId: Types.ObjectId;
  kotNumber: string;
  kotType: KOT_TYPE;
  /** Staff who generated this KOT */
  waiterId?: Types.ObjectId | null;
  tokenNo?: string;
  tableName?: string;
  notes?: string;
  status: KOT_STATUS;
  isPrinted: boolean;
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KOTItem {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  kotId: Types.ObjectId;
  orderItemId: Types.ObjectId;
  quantity: number;
  instruction?: string;
  /** Per-item kitchen status — mirrors OrderItem.itemStatus */
  itemStatus: ITEM_STATUS;
  /** When kitchen started preparing this specific item */
  preparedAt?: Date | null;
  /** When this item was served to guest */
  servedAt?: Date | null;
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Helper for Mongoose population */
export interface PopulatedKOTItem extends Omit<KOTItem, 'orderItemId'> {
  orderItemId: OrderItem;
}

// ─── Response Interfaces (Cleaned API Contracts) ──────────────────────────────

export interface KOTItemResponse {
  _id: Types.ObjectId;
  orderItemId: Types.ObjectId;
  itemName: string;
  variationName: string;
  quantity: number;
  instruction: string;
  itemStatus: ITEM_STATUS;
  preparedAt?: Date | null;
  servedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KOTResponse {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  kotNumber: string;
  kotType: KOT_TYPE;
  waiterId?: Types.ObjectId | { _id: Types.ObjectId; name: string; role?: string } | null;
  tokenNo?: string;
  tableName?: string;
  notes?: string;
  status: KOT_STATUS;
  isPrinted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  items: KOTItemResponse[];
}

// ─── Query Interfaces ────────────────────────────────────────────────────────

export interface KOTListQuery extends PaginationQuery {
  status?: KOT_STATUS;
  kotType?: KOT_TYPE;
  orderId?: string;
  search?: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface UpdateKOTStatusDTO {
  kotId: string;
  status: KOT_STATUS;
}

export interface KOTStatusUpdateResponse {
  status: KOT_STATUS;
}

export interface UpdateKOTItemStatusDTO {
  kotItemId: string;
  status: ITEM_STATUS;
}

export interface KOTItemStatusUpdateResponse {
  status: ITEM_STATUS;
}
