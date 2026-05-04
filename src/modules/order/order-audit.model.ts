import { Schema, model, type Model, type Types } from 'mongoose';

// ─── Action Enum ──────────────────────────────────────────────────────────────

export const ORDER_AUDIT_ACTION = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_CLOSED: 'ORDER_CLOSED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ITEMS_ADDED: 'ITEMS_ADDED',
  ITEM_CANCELLED: 'ITEM_CANCELLED',
  ITEM_UPDATED: 'ITEM_UPDATED',
  KOT_CREATED: 'KOT_CREATED',
  KOT_STATUS_UPDATED: 'KOT_STATUS_UPDATED',
  KOT_ITEM_STATUS_UPDATED: 'KOT_ITEM_STATUS_UPDATED',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  SETTLEMENT_PROCESSED: 'SETTLEMENT_PROCESSED',
  WRITE_OFF_APPROVED: 'WRITE_OFF_APPROVED',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  CREDIT_REVERSED: 'CREDIT_REVERSED',
  BILL_PRINTED: 'BILL_PRINTED'
} as const;

export type OrderAuditAction = (typeof ORDER_AUDIT_ACTION)[keyof typeof ORDER_AUDIT_ACTION];

// ─── Interface ────────────────────────────────────────────────────────────────

export interface OrderAuditLog {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderId: Types.ObjectId;
  action: OrderAuditAction;
  performedBy?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type OrderAuditLogModel = Model<OrderAuditLog>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const OrderAuditLogSchema = new Schema<OrderAuditLog>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    orderId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Order' },
    action: {
      type: String,
      enum: Object.values(ORDER_AUDIT_ACTION),
      required: true
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, default: () => new Date() }
  },
  {
    timestamps: false, // using custom `timestamp` field
    versionKey: false
  }
);

// Quick lookup by order; TTL cleanup after 90 days
OrderAuditLogSchema.index({ orderId: 1, timestamp: -1 });
OrderAuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const OrderAuditLogEntity = model<OrderAuditLog, OrderAuditLogModel>(
  'OrderAuditLog',
  OrderAuditLogSchema,
  'order_audit_logs'
);

export default OrderAuditLogEntity;
