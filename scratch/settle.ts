// ─── authManagerOverride ───────────────────────────────────────────────────────

const authManagerOverride = async (
  brandId: string,
  managerId?: string,
  managerPassword?: string
) => {
  if (!managerId || !managerPassword) {
    throw { status: 401, message: 'Manager override required (ID and Password missing)' };
  }

  const manager = await UserEntity.findOne({
    _id: new Types.ObjectId(managerId),
    brandId: new Types.ObjectId(brandId),
    isDelete: false,
    isActive: true
  });

  if (!manager) {
    throw { status: 401, message: 'Invalid manager credentials' };
  }

  const isValid = await manager.comparePassword(managerPassword);
  if (!isValid) {
    throw { status: 401, message: 'Invalid manager credentials' };
  }

  return manager;
};

// ─── settleOrderPayment ────────────────────────────────────────────────────────

export const settleOrderPayment = async (
  brandId: string,
  outletId: string,
  userId: string,
  dto: SettlePaymentDTO
) => {
  const { orderId, payments: paymentsInput, useCustomerCredit, managerId, managerPassword } = dto;

  const totalCollectedAmount = parseFloat(
    paymentsInput.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
  );

  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!order) throw { status: 404, message: 'Order not found' };

  if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
    throw { status: 400, message: `Cannot settle a ${order.status.toLowerCase()} order` };
  }
  if (order.settlementStatus === SETTLEMENT_STATUS.SETTLED) {
    throw { status: 400, message: 'Order is already settled' };
  }

  const outlet = await OutletEntity.findOne({
    _id: new Types.ObjectId(outletId),
    brandId: new Types.ObjectId(brandId)
  }).lean();

  if (!outlet) throw { status: 404, message: 'Outlet not found' };

  const paymentSettings = outlet.paymentSettings || {
    writeOffThreshold: 0,
    managerOverrideThreshold: 0,
    allowShortSettlement: false,
    refundApprovalThreshold: 0
  };

  const currentPaidAmount = order.paidAmount ?? 0;
  const balanceDue = parseFloat((order.totalAmount - currentPaidAmount).toFixed(2));
  
  let actualAppliedAmount = totalCollectedAmount;
  let creditUsed = 0;
  
  // Try to use customer credit if requested and short on payment
  if (useCustomerCredit && totalCollectedAmount < balanceDue && order.customerId) {
    const customer = await customerService.getCustomerById(brandId, outletId, order.customerId.toString());
    if (customer && customer.creditBalance > 0) {
      const shortfall = parseFloat((balanceDue - totalCollectedAmount).toFixed(2));
      creditUsed = Math.min(customer.creditBalance, shortfall);
      actualAppliedAmount += creditUsed;
    }
  }

  const settlementAdjustmentAmount = parseFloat((actualAppliedAmount - balanceDue).toFixed(2));
  let newSettlementStatus = SETTLEMENT_STATUS.SETTLED;

  if (settlementAdjustmentAmount < -0.001) {
    // Shortfall
    if (!paymentSettings.allowShortSettlement) {
      throw { status: 400, message: 'Short settlement is not allowed by outlet policy' };
    }
    
    const shortfallAbs = Math.abs(settlementAdjustmentAmount);
    if (shortfallAbs > paymentSettings.writeOffThreshold) {
      if (shortfallAbs > paymentSettings.managerOverrideThreshold) {
         throw { status: 400, message: 'Shortfall exceeds maximum manager override threshold' };
      }
      // Require manager approval
      await authManagerOverride(brandId, managerId, managerPassword);
    }
    newSettlementStatus = SETTLEMENT_STATUS.SHORT_SETTLED;
  } else if (settlementAdjustmentAmount > 0.001) {
    newSettlementStatus = SETTLEMENT_STATUS.OVER_SETTLED;
  }

  const newPaymentStatus = newSettlementStatus === SETTLEMENT_STATUS.SHORT_SETTLED ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.PAID;
  const newPaidAmount = parseFloat((currentPaidAmount + totalCollectedAmount + creditUsed).toFixed(2));

  const previousPaymentMethods = await PaymentEntity.distinct('paymentMethod', {
    orderId: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  });

  const allMethods = new Set([
    ...previousPaymentMethods,
    ...paymentsInput.map(p => p.paymentMethod)
  ]);
  if (creditUsed > 0) allMethods.add(PAYMENT_METHOD.WALLET); // Using customer credit is technically a wallet-like method
  const isSplitPayment = allMethods.size > 1;

  const session = await mongoose.startSession();
  let savedPayments: Payment[] = [];
  let updatedOrder: Record<string, unknown> | null = null;
  let adjustmentLedgerRecord: any = null;

  try {
    session.startTransaction();

    const paymentDocsToInsert = paymentsInput.map(p => ({
      _id: new Types.ObjectId(),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      orderId: new Types.ObjectId(orderId),
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      reference: p.reference?.trim() || null,
      recordedBy: new Types.ObjectId(userId),
      settlementSource: SETTLEMENT_SOURCE.DIRECT_PAYMENT,
      isDelete: false
    }));

    if (creditUsed > 0) {
       paymentDocsToInsert.push({
         _id: new Types.ObjectId(),
         brandId: new Types.ObjectId(brandId),
         outletId: new Types.ObjectId(outletId),
         orderId: new Types.ObjectId(orderId),
         amount: creditUsed,
         paymentMethod: PAYMENT_METHOD.WALLET, // Or introduce CUSTOMER_CREDIT enum
         reference: 'Customer Credit Applied',
         recordedBy: new Types.ObjectId(userId),
         settlementSource: SETTLEMENT_SOURCE.CUSTOMER_CREDIT,
         isDelete: false
       });
       await customerService.adjustCreditBalance(brandId, order.customerId!.toString(), -creditUsed, session);
    }

    if (paymentDocsToInsert.length > 0) {
      const paymentDocs = await PaymentEntity.insertMany(paymentDocsToInsert, { session });
      savedPayments = paymentDocs as unknown as Payment[];
    }

    // Handle Adjustments (Shortfall/Overpayment)
    if (settlementAdjustmentAmount < -0.001) {
      // Shortfall -> Log to Settlement Ledger as WRITE_OFF or SHORTFALL, or increment dueBalance
      if (order.customerId) {
         await customerService.adjustDueBalance(brandId, order.customerId.toString(), Math.abs(settlementAdjustmentAmount), session);
      } else {
         // Create a write-off entry
         adjustmentLedgerRecord = await SettlementAdjustmentLedgerEntity.create([{
           brandId: new Types.ObjectId(brandId),
           outletId: new Types.ObjectId(outletId),
           orderId: new Types.ObjectId(orderId),
           amount: Math.abs(settlementAdjustmentAmount),
           adjustmentType: ADJUSTMENT_TYPE.WRITE_OFF,
           recordedBy: new Types.ObjectId(userId),
           approvedBy: managerId ? new Types.ObjectId(managerId) : undefined,
           notes: 'Automatic write-off during settlement'
         }], { session });
      }
    } else if (settlementAdjustmentAmount > 0.001) {
      // Overpayment -> Increment creditBalance or Log OVERPAYMENT
      if (order.customerId) {
        await customerService.adjustCreditBalance(brandId, order.customerId.toString(), settlementAdjustmentAmount, session);
      } else {
         adjustmentLedgerRecord = await SettlementAdjustmentLedgerEntity.create([{
           brandId: new Types.ObjectId(brandId),
           outletId: new Types.ObjectId(outletId),
           orderId: new Types.ObjectId(orderId),
           amount: settlementAdjustmentAmount,
           adjustmentType: ADJUSTMENT_TYPE.OVERPAYMENT,
           recordedBy: new Types.ObjectId(userId),
           notes: 'Overpayment during settlement'
         }], { session });
      }
    }

    updatedOrder = (await OrderEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(orderId) },
      {
        $set: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          settlementStatus: newSettlementStatus,
          settlementAdjustmentAmount,
          isSplitPayment,
          paymentMethod: order.paymentMethod ?? (paymentsInput.length > 0 ? paymentsInput[0].paymentMethod : null)
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

  // Audit
  logOrderAction({
    brandId,
    outletId,
    orderId,
    action: ORDER_AUDIT_ACTION.SETTLEMENT_PROCESSED,
    performedBy: userId,
    metadata: {
      totalCollectedAmount,
      creditUsed,
      settlementAdjustmentAmount,
      newSettlementStatus,
      newPaidAmount
    }
  });

  // Always attempt to close order if we settled it, even if short_settled.
  if (newSettlementStatus !== SETTLEMENT_STATUS.UNSETTLED) {
    // The auto-close function will check if KOTs are done.
    // Wait, checkAndAutoCloseOrder currently requires PAYMENT_STATUS.PAID or we must update it to check SETTLEMENT_STATUS.
    await checkAndAutoCloseOrder(brandId, outletId, orderId, userId);
  }

  return {
    payments: savedPayments,
    order: {
      _id: updatedOrder!['_id'],
      totalAmount: updatedOrder!['totalAmount'],
      paidAmount: newPaidAmount,
      balanceDue: parseFloat((order.totalAmount - newPaidAmount).toFixed(2)),
      paymentStatus: newPaymentStatus,
      settlementStatus: newSettlementStatus,
      settlementAdjustmentAmount,
      paymentMethod: updatedOrder!['paymentMethod'],
      isSplitPayment: updatedOrder!['isSplitPayment']
    }
  };
};
