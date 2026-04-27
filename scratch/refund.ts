// ─── processRefund ─────────────────────────────────────────────────────────────

export const processRefund = async (
  brandId: string,
  outletId: string,
  userId: string,
  dto: RefundPaymentDTO
) => {
  const { orderId, refundAmount, managerId, managerPassword, refundReason } = dto;

  if (refundAmount <= 0) {
    throw { status: 400, message: 'Refund amount must be greater than zero' };
  }

  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!order) throw { status: 404, message: 'Order not found' };

  if (order.paidAmount! < refundAmount) {
     throw { status: 400, message: 'Refund amount cannot exceed total paid amount' };
  }

  const outlet = await OutletEntity.findOne({
    _id: new Types.ObjectId(outletId),
    brandId: new Types.ObjectId(brandId)
  }).lean();

  const paymentSettings = outlet?.paymentSettings || { refundApprovalThreshold: 0 };

  if (paymentSettings.refundApprovalThreshold > 0 && refundAmount > paymentSettings.refundApprovalThreshold) {
     await authManagerOverride(brandId, managerId, managerPassword);
  }

  // Determine refund method
  let methodsToRefund: { method: number, amount: number }[] = [];
  
  if (dto.refundMethod) {
     methodsToRefund.push({ method: dto.refundMethod, amount: refundAmount });
  } else {
     // Default: Original tender first
     const previousPayments = await PaymentEntity.find({
       orderId: new Types.ObjectId(orderId),
       brandId: new Types.ObjectId(brandId),
       isRefund: false,
       isDelete: false
     }).sort({ amount: -1 }).lean();

     let amountLeftToRefund = refundAmount;
     for (const p of previousPayments) {
        if (amountLeftToRefund <= 0) break;
        // Ignore CUSTOMER_CREDIT payments if possible? Actually, if they paid via wallet, we refund via wallet.
        const canRefundFromThis = Math.min(p.amount, amountLeftToRefund);
        methodsToRefund.push({ method: p.paymentMethod, amount: canRefundFromThis });
        amountLeftToRefund -= canRefundFromThis;
     }

     if (amountLeftToRefund > 0) {
        // Fallback to customer credit if possible, otherwise just add as cash (or original order method)
        if (order.customerId) {
           methodsToRefund.push({ method: PAYMENT_METHOD.WALLET, amount: amountLeftToRefund });
        } else {
           methodsToRefund.push({ method: previousPayments[0]?.paymentMethod || PAYMENT_METHOD.CASH, amount: amountLeftToRefund });
        }
     }
  }

  const session = await mongoose.startSession();
  let savedRefunds: Payment[] = [];
  let updatedOrder: Record<string, unknown> | null = null;

  try {
    session.startTransaction();

    const refundDocsToInsert = methodsToRefund.map(r => ({
      _id: new Types.ObjectId(),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      orderId: new Types.ObjectId(orderId),
      amount: r.amount, // Refund is stored as positive amount
      paymentMethod: r.method,
      reference: 'Refund',
      recordedBy: new Types.ObjectId(userId),
      settlementSource: SETTLEMENT_SOURCE.REFUND_REVERSAL,
      isRefund: true,
      refundReason: refundReason || null,
      isDelete: false
    }));

    const refundDocs = await PaymentEntity.insertMany(refundDocsToInsert, { session });
    savedRefunds = refundDocs as unknown as Payment[];

    // If any refund method is WALLET, add to customer credit
    const walletRefunds = methodsToRefund.filter(m => m.method === PAYMENT_METHOD.WALLET);
    if (walletRefunds.length > 0 && order.customerId) {
       const totalWalletRefund = walletRefunds.reduce((sum, r) => sum + r.amount, 0);
       await customerService.adjustCreditBalance(brandId, order.customerId.toString(), totalWalletRefund, session);
    }

    const currentRefundedAmount = order.refundedAmount || 0;
    const newRefundedAmount = currentRefundedAmount + refundAmount;
    
    // Check if fully refunded
    const isFullyRefunded = newRefundedAmount >= order.paidAmount! - 0.001;
    const newSettlementStatus = isFullyRefunded ? SETTLEMENT_STATUS.REFUNDED : SETTLEMENT_STATUS.PARTIALLY_REFUNDED;

    updatedOrder = (await OrderEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(orderId) },
      {
        $inc: { refundedAmount: refundAmount },
        $set: {
          isRefunded: true,
          settlementStatus: newSettlementStatus
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

  logOrderAction({
    brandId,
    outletId,
    orderId,
    action: ORDER_AUDIT_ACTION.REFUND_PROCESSED,
    performedBy: userId,
    metadata: {
      refundAmount,
      refundReason,
      refundMethods: methodsToRefund,
      managerOverride: !!managerId
    }
  });

  return {
    refunds: savedRefunds,
    order: {
      _id: updatedOrder!['_id'],
      paidAmount: updatedOrder!['paidAmount'],
      refundedAmount: updatedOrder!['refundedAmount'],
      isRefunded: updatedOrder!['isRefunded'],
      settlementStatus: updatedOrder!['settlementStatus']
    }
  };
};
