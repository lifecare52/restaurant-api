import {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ITEM_STATUS,
  PAYMENT_METHOD
} from '@shared/enum/order.enum';
import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';

export { ORDER_TYPE, ORDER_STATUS, PAYMENT_STATUS, ITEM_STATUS, PAYMENT_METHOD };

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface Order {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  /** The staff member who created / owns the order */
  waiterId?: Types.ObjectId | null;
  orderNumber: string;
  tokenNo?: string | null;
  orderType: ORDER_TYPE;
  tableId?: Types.ObjectId | null;
  status: ORDER_STATUS;
  // Financials
  subtotal: number;
  discountAmount: number;
  discountType?: number | null; // FLAT=1, PERCENTAGE=2
  discountValue?: number | null; // the raw input value (e.g. 50 or 10%)
  totalAmount: number;
  // Payment
  paymentStatus: PAYMENT_STATUS;
  paymentMethod?: PAYMENT_METHOD | null;
  shippingAddress?: string | null;
  notes?: string | null;
  confirmedAt?: Date | null;
  closedAt?: Date | null;
  // Cancellation
  cancellationReason?: string | null;
  cancelledBy?: Types.ObjectId | null;
  // Soft delete
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeasurementSelectionDTO {
  measurementId: string;
  unit: string;
  enteredQuantity: number;
  baseUnit: string;
  baseUnitQuantity: number;
  baseValue: number;
  basePrice: number;
  totalPrice: number;
}

export interface OrderItem {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderId: Types.ObjectId;
  menuItemId: Types.ObjectId;
  itemName: string;
  basePrice: number;
  quantity: number;
  measurement?: MeasurementSelectionDTO;
  variationId?: Types.ObjectId | null;
  variationName?: string | null;
  instruction?: string | null;
  totalPrice: number;
  /** Per-item kitchen lifecycle status */
  itemStatus: ITEM_STATUS;
  /** When this item was sent to KOT the first time */
  kotSentAt?: Date | null;
  /** Cancellation info (if itemStatus = CANCELLED) */
  cancelReason?: string | null;
  cancelledAt?: Date | null;
  cancelledBy?: Types.ObjectId | null;
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemAddon {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderId: Types.ObjectId;
  orderItemId: Types.ObjectId;
  addonId: Types.ObjectId;
  addonItemId: Types.ObjectId;
  addonName: string;
  addonItemName?: string | null;
  price: number;
  quantity: number;
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Internal Processing Helpers ─────────────────────────────────────────────

export interface ProcessedOrderItem extends Omit<OrderItem, 'orderId'> {
  orderId?: Types.ObjectId;
}

export interface ProcessedOrderItemAddon extends Omit<OrderItemAddon, 'orderId'> {
  orderId?: Types.ObjectId;
}

// ─── Query Interfaces ────────────────────────────────────────────────────────

export interface OrderListQuery extends PaginationQuery {
  status?: ORDER_STATUS;
  orderType?: ORDER_TYPE;
  tableId?: string;
  orderNumber?: string;
  waiterId?: string;
  /** ISO date string — list orders created on or after this date */
  fromDate?: string;
  /** ISO date string — list orders created on or before this date */
  toDate?: string;
  search?: string;
}

// ─── DTOs (API Contracts) ────────────────────────────────────────────────────

export interface AddonDTO {
  addonId: string;
  addonItemId: string;
  quantity: number;
}

export interface AddItemToOrderDTO {
  menuItemId: string;
  quantity?: number;
  measurement?: MeasurementSelectionDTO;
  variationId?: string;
  instruction?: string;
  addons?: AddonDTO[];
}

export interface CreateOrderDTO {
  orderType: ORDER_TYPE;
  tableId?: string;
  items: AddItemToOrderDTO[];
  notes?: string;
}

export interface AddItemsToOrderDTO {
  orderId: string;
  items: AddItemToOrderDTO[];
}

export interface RemoveOrderItemDTO {
  orderId: string;
  orderItemId: string;
  cancelReason?: string;
}

export interface UpdateOrderItemDTO {
  orderId: string;
  orderItemId: string;
  quantity?: number;
  instruction?: string;
}

export interface CloseOrderDTO {
  orderId: string;
  paymentMethod?: PAYMENT_METHOD;
}

export interface CancelOrderDTO {
  orderId: string;
  cancellationReason?: string;
}

export interface KOTFriendlyItem {
  name: string;
  variation: string | null;
  quantity: number;
  instruction: string | null;
  addons: Array<{
    name: string;
    quantity: number;
  }>;
}

export interface KOTFriendlyBatch {
  kotNumber: string;
  createdAt: string | null;
  items: KOTFriendlyItem[];
}

export interface KOTFriendlyResponse {
  orderId: string;
  orderNumber: string;
  orderType: ORDER_TYPE;
  table: string | null;
  status: ORDER_STATUS;
  notes: string | null;
  kots: KOTFriendlyBatch[];
}

