import { Schema, model, type Model } from 'mongoose';

import {
  type Order,
  type OrderItem,
  type OrderItemAddon,
  type AppliedTaxSnapshot,
  type OrderTaxBreakup,
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ITEM_STATUS,
  SETTLEMENT_STATUS
} from '@modules/order/order.types';

export type OrderModel = Model<Order>;
export type OrderItemModel = Model<OrderItem>;
export type OrderItemAddonModel = Model<OrderItemAddon>;

const AppliedTaxSnapshotSchema = new Schema<AppliedTaxSnapshot>(
  {
    taxId: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT_AMOUNT'],
      required: true
    },
    isInclusive: { type: Boolean, required: true },
    calculationMethod: {
      type: String,
      enum: ['STANDARD', 'CUMULATIVE'],
      required: true
    },
    taxableAmount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const OrderTaxBreakupSchema = new Schema<OrderTaxBreakup>(
  {
    taxId: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT_AMOUNT'],
      required: true
    },
    isInclusive: { type: Boolean, required: true },
    calculationMethod: {
      type: String,
      enum: ['STANDARD', 'CUMULATIVE'],
      required: true
    },
    taxableAmount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const OrderSchema = new Schema<Order>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    waiterId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    orderNumber: { type: String, required: true, index: true },
    tokenNo: { type: String, default: '' },
    orderType: {
      type: Number,
      enum: Object.values(ORDER_TYPE).filter(v => !isNaN(Number(v))),
      required: true
    },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', default: null },
    status: {
      type: Number,
      enum: Object.values(ORDER_STATUS).filter(v => !isNaN(Number(v))),
      default: ORDER_STATUS.OPEN
    },
    grossAmount: { type: Number, required: true, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    roundOffAmount: { type: Number, required: true, default: 0 },
    taxBreakup: { type: [OrderTaxBreakupSchema], default: [] },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    discountType: { type: Number, default: null },
    discountValue: { type: Number, default: null },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: Number,
      enum: Object.values(PAYMENT_STATUS).filter(v => !isNaN(Number(v))),
      default: PAYMENT_STATUS.UNPAID
    },
    paymentMethod: { type: Number, default: null },
    /** Running total of all payments recorded against this order */
    paidAmount: { type: Number, default: 0, min: 0 },
    settlementStatus: {
      type: Number,
      enum: Object.values(SETTLEMENT_STATUS).filter(v => !isNaN(Number(v))),
      default: SETTLEMENT_STATUS.UNSETTLED
    },
    settlementAdjustmentAmount: { type: Number, default: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },
    isRefunded: { type: Boolean, default: false },
    isSplitPayment: { type: Boolean, default: false },
    shippingAddress: { type: String, default: '' },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    confirmedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    cancellationReason: { type: String, default: '' },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    manualTagId: { type: Schema.Types.ObjectId, ref: 'CustomerTag', default: null },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

OrderSchema.index({ brandId: 1, outletId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ brandId: 1, outletId: 1, status: 1 });
OrderSchema.index({ brandId: 1, outletId: 1, tableId: 1 });
OrderSchema.index({ brandId: 1, outletId: 1, waiterId: 1 });
OrderSchema.index({ brandId: 1, outletId: 1, customerId: 1 });
OrderSchema.index({ brandId: 1, outletId: 1, orderType: 1, status: 1 });
OrderSchema.index({ brandId: 1, outletId: 1, createdAt: -1 });

export const OrderEntity = model<Order, OrderModel>('Order', OrderSchema, 'orders');

const MeasurementSelectionSchema = new Schema(
  {
    measurementId: { type: String, required: true },
    unit: { type: String, required: true },
    enteredQuantity: { type: Number, required: true },
    baseUnit: { type: String, required: true },
    baseUnitQuantity: { type: Number, required: true },
    baseValue: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  },
  { _id: false }
);

const OrderItemSchema = new Schema<OrderItem>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    orderId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Order' },
    menuItemId: { type: Schema.Types.ObjectId, required: true, ref: 'MenuItem' },
    itemName: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    taxGroupId: { type: Schema.Types.ObjectId, ref: 'TaxGroup', default: null },
    baseLineAmount: { type: Number, required: true, min: 0, default: 0 },
    addonTotal: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    taxableAmount: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    grossLineAmount: { type: Number, required: true, min: 0, default: 0 },
    netLineAmount: { type: Number, required: true, min: 0, default: 0 },
    appliedTaxes: { type: [AppliedTaxSnapshotSchema], default: [] },
    measurement: { type: MeasurementSelectionSchema, default: undefined },
    variationId: { type: Schema.Types.ObjectId, ref: 'MenuItemVariant', default: null },
    variationName: { type: String, default: '' },
    instruction: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300
    },
    totalPrice: { type: Number, required: true, min: 0 },
    itemStatus: {
      type: Number,
      enum: Object.values(ITEM_STATUS).filter(v => !isNaN(Number(v))),
      default: ITEM_STATUS.PENDING
    },
    kotSentAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

OrderItemSchema.index({ orderId: 1, itemStatus: 1 });
OrderItemSchema.index({ orderId: 1, isDelete: 1 });

export const OrderItemEntity = model<OrderItem, OrderItemModel>(
  'OrderItem',
  OrderItemSchema,
  'order_items'
);

const OrderItemAddonSchema = new Schema<OrderItemAddon>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    orderId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Order' },
    orderItemId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'OrderItem' },
    addonId: { type: Schema.Types.ObjectId, required: true, ref: 'Addon' },
    addonItemId: { type: Schema.Types.ObjectId, required: true, ref: 'AddonItem' },
    addonName: { type: String, required: true },
    addonItemName: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const OrderItemAddonEntity = model<OrderItemAddon, OrderItemAddonModel>(
  'OrderItemAddon',
  OrderItemAddonSchema,
  'order_item_addons'
);

export default {
  OrderEntity,
  OrderItemEntity,
  OrderItemAddonEntity
};
