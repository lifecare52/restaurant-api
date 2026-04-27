import { Schema, model, type Model } from 'mongoose';

import { PAYMENT_METHOD, SETTLEMENT_SOURCE } from '@modules/payment/payment.types';
import type { Payment } from '@modules/payment/payment.types';

export type PaymentModel = Model<Payment>;

// ─── Payment Schema ───────────────────────────────────────────────────────────

const PaymentSchema = new Schema<Payment>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    orderId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Order' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: Number,
      enum: Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))),
      required: true
    },
    reference: { type: String, trim: true, default: null, maxlength: 100 },
    recordedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    settlementSource: {
      type: Number,
      enum: Object.values(SETTLEMENT_SOURCE).filter(v => !isNaN(Number(v))),
      default: SETTLEMENT_SOURCE.DIRECT_PAYMENT
    },
    isRefund: { type: Boolean, default: false },
    refundReason: { type: String, trim: true, default: null, maxlength: 500 },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Fast per-order payment lookup and reporting queries
PaymentSchema.index({ brandId: 1, outletId: 1, orderId: 1 });
PaymentSchema.index({ brandId: 1, outletId: 1, createdAt: -1 });

export const PaymentEntity = model<Payment, PaymentModel>('Payment', PaymentSchema, 'payments');

export default PaymentEntity;
