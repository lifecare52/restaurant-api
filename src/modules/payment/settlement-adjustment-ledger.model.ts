import { Schema, model, type Model, Types } from 'mongoose';

export enum ADJUSTMENT_TYPE {
  OVERPAYMENT = 'OVERPAYMENT',
  SHORTFALL = 'SHORTFALL',
  WRITE_OFF = 'WRITE_OFF',
  CORRECTION = 'CORRECTION',
  REVERSAL = 'REVERSAL'
}

export interface SettlementAdjustmentLedger {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderId: Types.ObjectId;
  customerId?: Types.ObjectId | null;
  amount: number;
  adjustmentType: ADJUSTMENT_TYPE;
  recordedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId | null;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SettlementAdjustmentLedgerModel = Model<SettlementAdjustmentLedger>;

const SettlementAdjustmentLedgerSchema = new Schema<SettlementAdjustmentLedger>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    orderId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Order' },
    customerId: { type: Schema.Types.ObjectId, default: null, ref: 'Customer' },
    amount: { type: Number, required: true },
    adjustmentType: {
      type: String,
      enum: Object.values(ADJUSTMENT_TYPE),
      required: true
    },
    recordedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, default: null, ref: 'User' },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

SettlementAdjustmentLedgerSchema.index({ brandId: 1, outletId: 1, orderId: 1 });
SettlementAdjustmentLedgerSchema.index({ brandId: 1, outletId: 1, createdAt: -1 });

export const SettlementAdjustmentLedgerEntity = model<SettlementAdjustmentLedger, SettlementAdjustmentLedgerModel>(
  'SettlementAdjustmentLedger',
  SettlementAdjustmentLedgerSchema,
  'settlement_adjustment_ledgers'
);

export default SettlementAdjustmentLedgerEntity;
