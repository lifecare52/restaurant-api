import { PAYMENT_METHOD, PAYMENT_STATUS } from '@shared/enum/order.enum';
import type { PaginationQuery } from '@shared/interfaces/pagination';
import type { Types } from 'mongoose';

export { PAYMENT_METHOD, PAYMENT_STATUS };

// ─── Core Entity ─────────────────────────────────────────────────────────────

export interface Payment {
  _id?: Types.ObjectId;
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderId: Types.ObjectId;
  /** Amount paid in this single transaction */
  amount: number;
  paymentMethod: PAYMENT_METHOD;
  /** Optional transaction reference: UPI txn ID, card last 4, etc. */
  reference?: string | null;
  /** Staff member who recorded this payment */
  recordedBy: Types.ObjectId;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface PaymentInputDTO {
  amount: number;
  paymentMethod: PAYMENT_METHOD;
  reference?: string;
}

export interface CreatePaymentDTO {
  orderId: string;
  // Legacy single payment
  amount?: number;
  paymentMethod?: PAYMENT_METHOD;
  reference?: string;
  // Multiple payments
  payments?: PaymentInputDTO[];
}

export interface PaymentListQuery extends PaginationQuery {
  orderId?: string;
  paymentMethod?: PAYMENT_METHOD;
  fromDate?: string;
  toDate?: string;
}

// ─── Response Shapes ─────────────────────────────────────────────────────────

export interface OrderPaymentSummary {
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PAYMENT_STATUS;
  isSplitPayment: boolean;
  payments: Payment[];
}
