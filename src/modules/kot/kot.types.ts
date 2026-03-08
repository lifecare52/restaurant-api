import type { Types } from 'mongoose';

import type { PaginationQuery } from '@shared/interfaces/pagination';
import { KOT_STATUS, KOT_TYPE, ITEM_STATUS } from '@shared/enum/order.enum';

export { KOT_STATUS, KOT_TYPE, ITEM_STATUS };

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface KOT {
    _id?: Types.ObjectId;
    brandId: Types.ObjectId;
    outletId: Types.ObjectId;
    orderId: Types.ObjectId;
    kotNumber: string;
    kotType: KOT_TYPE;
    /** Staff who generated this KOT */
    waiterId?: Types.ObjectId | null;
    tokenNo?: string | null;
    tableName?: string | null;
    status: KOT_STATUS;
    isPrinted: boolean;
    isActive: boolean;
    isDelete: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface KOTItem {
    _id?: Types.ObjectId;
    brandId: Types.ObjectId;
    outletId: Types.ObjectId;
    kotId: Types.ObjectId;
    orderItemId: Types.ObjectId;
    quantity: number;
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

export interface UpdateKOTItemStatusDTO {
    kotItemId: string;
    status: ITEM_STATUS;
}
