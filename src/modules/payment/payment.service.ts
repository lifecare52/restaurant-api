import mongoose, { Types, type FilterQuery } from 'mongoose';

import { ORDER_AUDIT_ACTION } from '@modules/order/order-audit.model';
import { logOrderAction } from '@modules/order/order-audit.service';
import { OrderEntity } from '@modules/order/order.model';
import { checkAndAutoCloseOrder } from '@modules/order/order.service';
import { ORDER_STATUS } from '@modules/order/order.types';
import { PaymentEntity } from '@modules/payment/payment.model';
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  type CreatePaymentDTO,
  type Payment,
  type PaymentListQuery,
  type OrderPaymentSummary
} from '@modules/payment/payment.types';

// ─── recordPayment ────────────────────────────────────────────────────────────

/**
 * Records a single payment transaction against an order.
 * Atomically increments paidAmount on the Order and updates paymentStatus.
 * Supports partial payments — call multiple times until order is PAID.
 */
export const recordPayment = async (
  brandId: string,
  outletId: string,
  userId: string,
  dto: CreatePaymentDTO
): Promise<{ payments: Payment[]; order: Record<string, unknown> }> => {
  // Normalize payload
  const paymentsInput = dto.payments?.length
    ? dto.payments
    : [{ amount: dto.amount!, paymentMethod: dto.paymentMethod!, reference: dto.reference }];

  const totalPaymentAmount = parseFloat(
    paymentsInput.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
  );

  // ── 1. Fetch and validate order ──────────────────────────────────────────
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!order) throw { status: 404, message: 'Order not found' };

  if (order.status === ORDER_STATUS.COMPLETED) {
    throw { status: 400, message: 'Order is already closed' };
  }
  if (order.status === ORDER_STATUS.CANCELLED) {
    throw { status: 400, message: 'Cannot record payment on a cancelled order' };
  }
  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw { status: 400, message: 'Order is already fully paid' };
  }
  if (totalPaymentAmount <= 0) {
    throw { status: 400, message: 'Total payment amount must be greater than zero' };
  }

  const currentPaidAmount = order.paidAmount ?? 0;
  const balanceDue = order.totalAmount - currentPaidAmount;

  if (totalPaymentAmount > balanceDue + 0.001) {
    // +0.001 for float tolerance
    throw {
      status: 400,
      message: `Total payment amount (${totalPaymentAmount}) exceeds balance due (${balanceDue.toFixed(2)})`
    };
  }

  // ── 2. Compute new paidAmount and paymentStatus ──────────────────────────
  const newPaidAmount = parseFloat((currentPaidAmount + totalPaymentAmount).toFixed(2));
  const newPaymentStatus =
    newPaidAmount >= order.totalAmount - 0.001 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL;

  const previousPaymentMethods = await PaymentEntity.distinct('paymentMethod', {
    orderId: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  });

  const allMethods = new Set([
    ...previousPaymentMethods,
    ...paymentsInput.map(p => p.paymentMethod)
  ]);
  const isSplitPayment = allMethods.size > 1;

  // ── 3. Atomic transaction ────────────────────────────────────────────────
  const session = await mongoose.startSession();
  let savedPayments: Payment[] = [];
  let updatedOrder: Record<string, unknown> | null = null;

  try {
    session.startTransaction();

    const paymentDocsToInsert = paymentsInput.map(p => ({
      _id: new Types.ObjectId(),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      orderId: new Types.ObjectId(dto.orderId),
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      reference: p.reference?.trim() || null,
      recordedBy: new Types.ObjectId(userId),
      isDelete: false
    }));

    const paymentDocs = await PaymentEntity.insertMany(paymentDocsToInsert, { session });
    savedPayments = paymentDocs as unknown as Payment[];

    updatedOrder = (await OrderEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(dto.orderId) },
      {
        $inc: { paidAmount: totalPaymentAmount },
        $set: {
          paymentStatus: newPaymentStatus,
          isSplitPayment,
          // Record first / primary paymentMethod on the order for quick reporting
          paymentMethod: order.paymentMethod ?? paymentsInput[0].paymentMethod
        }
      },
      { new: true, session }
    ).lean()) as Record<string, unknown>;

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // ── 4. Audit log (fire and forget) ──────────────────────────────────────
  logOrderAction({
    brandId,
    outletId,
    orderId: dto.orderId,
    action: ORDER_AUDIT_ACTION.PAYMENT_RECORDED,
    performedBy: userId,
    metadata: {
      paymentIds: savedPayments.map(p => String(p._id)),
      totalAmountPaidNow: totalPaymentAmount,
      isSplitPayment: order.isSplitPayment || isSplitPayment,
      paymentMethods: paymentsInput.map(p => p.paymentMethod),
      newPaidAmount,
      newPaymentStatus
    }
  });

  // ── 5. Auto-close Evaluation ────────────────────────────────────────────
  if (newPaymentStatus === PAYMENT_STATUS.PAID) {
    // Attempt auto-close. If KOT items are completely ready, it will close the order.
    // We execute this concurrently or sequentially.
    await checkAndAutoCloseOrder(brandId, outletId, dto.orderId, userId);
  }

  return {
    payments: savedPayments,
    order: {
      _id: updatedOrder!['_id'],
      totalAmount: updatedOrder!['totalAmount'],
      paidAmount: newPaidAmount,
      balanceDue: parseFloat((order.totalAmount - newPaidAmount).toFixed(2)),
      paymentStatus: newPaymentStatus,
      paymentMethod: updatedOrder!['paymentMethod'],
      isSplitPayment: updatedOrder!['isSplitPayment']
    }
  };
};

// ─── getPaymentsByOrder ───────────────────────────────────────────────────────

/**
 * Returns all payment records for a given order along with running totals.
 */
export const getPaymentsByOrder = async (
  brandId: string,
  outletId: string,
  orderId: string
): Promise<OrderPaymentSummary> => {
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!order) throw { status: 404, message: 'Order not found' };

  const payments = await PaymentEntity.find({
    orderId: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  })
    .sort({ createdAt: 1 })
    .lean();

  const paidAmount = order.paidAmount ?? 0;
  const balanceDue = parseFloat((order.totalAmount - paidAmount).toFixed(2));

  return {
    orderId,
    totalAmount: order.totalAmount,
    paidAmount,
    balanceDue,
    paymentStatus: order.paymentStatus,
    isSplitPayment: order.isSplitPayment ?? false,
    payments: payments as Payment[]
  };
};

// ─── listPayments ─────────────────────────────────────────────────────────────

/**
 * Paginated list of all payment records with optional filters.
 */
export const listPayments = async (
  brandId: string,
  outletId: string,
  query: PaymentListQuery | Record<string, never> = {}
): Promise<{ items: Payment[]; total: number }> => {
  const filter: FilterQuery<Payment> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  };

  if (query.orderId) filter.orderId = new Types.ObjectId(query.orderId);
  if (query.paymentMethod) filter.paymentMethod = Number(query.paymentMethod);

  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.$lte = new Date(query.toDate);
  }

  const limit = Math.max(1, Number(query.limit) || 20);
  const skip = (Math.max(1, Number(query.page) || 1) - 1) * limit;

  const [items, total] = await Promise.all([
    PaymentEntity.find(filter)
      .populate('recordedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PaymentEntity.countDocuments(filter)
  ]);

  return { items: items as Payment[], total };
};
