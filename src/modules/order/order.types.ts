import {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ITEM_STATUS,
  PAYMENT_METHOD,
  SETTLEMENT_STATUS,
  SETTLEMENT_SOURCE
} from '@shared/enum/order.enum';
import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { Types } from 'mongoose';
import type { Payment } from '@modules/payment/payment.types';

export { ORDER_TYPE, ORDER_STATUS, PAYMENT_STATUS, ITEM_STATUS, PAYMENT_METHOD, SETTLEMENT_STATUS, SETTLEMENT_SOURCE };

export interface AppliedTaxSnapshot {
  taxId?: Types.ObjectId | null;
  name: string;
  rate: number;
  type: 'PERCENTAGE' | 'FLAT_AMOUNT';
  isInclusive: boolean;
  calculationMethod: 'STANDARD' | 'CUMULATIVE';
  taxableAmount: number;
  taxAmount: number;
}

export interface OrderTaxBreakup extends AppliedTaxSnapshot { }

export interface Order {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  waiterId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  orderNumber: string;
  tokenNo?: string;
  orderType: ORDER_TYPE;
  tableId?: Types.ObjectId | null;
  status: ORDER_STATUS;
  grossAmount?: number;
  subtotal: number;
  taxableAmount?: number;
  taxAmount?: number;
  roundOffAmount?: number;
  taxBreakup?: OrderTaxBreakup[];
  discountAmount: number;
  discountType?: number | null;
  discountValue?: number | null;
  totalAmount: number;
  paymentStatus: PAYMENT_STATUS;
  paymentMethod?: PAYMENT_METHOD | null;
  /** Running total of all payment transactions recorded against this order */
  paidAmount?: number;
  /** Settlement details */
  settlementStatus: SETTLEMENT_STATUS;
  settlementAdjustmentAmount?: number;
  refundedAmount?: number;
  isRefunded?: boolean;
  /** Indicates whether the order was paid via multiple payment methods (split payment) */
  isSplitPayment?: boolean;
  shippingAddress?: string;
  notes?: string;
  confirmedAt?: Date | null;
  closedAt?: Date | null;
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId | null;
  manualTagId?: Types.ObjectId | null;
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
  taxGroupId?: Types.ObjectId | null;
  baseLineAmount?: number;
  addonTotal?: number;
  discountAmount?: number;
  taxableAmount?: number;
  taxAmount?: number;
  grossLineAmount?: number;
  netLineAmount?: number;
  appliedTaxes?: AppliedTaxSnapshot[];
  measurement?: MeasurementSelectionDTO;
  variationId?: Types.ObjectId | null;
  variationName?: string;
  instruction?: string;
  totalPrice: number;
  itemStatus: ITEM_STATUS;
  kotSentAt?: Date | null;
  cancelReason?: string;
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
  addonItemName?: string;
  price: number;
  quantity: number;
  isActive: boolean;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProcessedOrderItem extends Omit<OrderItem, 'orderId'> {
  orderId?: Types.ObjectId;
}

export interface ProcessedOrderItemAddon extends Omit<OrderItemAddon, 'orderId'> {
  orderId?: Types.ObjectId;
}

export interface OrderListQuery extends PaginationQuery {
  status?: ORDER_STATUS;
  orderType?: ORDER_TYPE;
  tableId?: string;
  orderNumber?: string;
  waiterId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

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
  customerId?: string;
  items: AddItemToOrderDTO[];
  manualTagId?: string;
  notes?: string;
  shippingAddress?: string;
}

export interface PreviewOrderDTO extends CreateOrderDTO { }

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

export type Cleaned<T> = Omit<T, 'brandId' | 'outletId' | '__v'>;

export interface KOTFriendlyBatch {
  kotNumber: string;
  createdAt: string | null;
  items: Array<Cleaned<OrderItem> & { addons: Cleaned<OrderItemAddon>[] }>;
}

export type KOTFriendlyResponse = Cleaned<Order> & {
  kots: KOTFriendlyBatch[];
  payments: Cleaned<Payment>[];
};
