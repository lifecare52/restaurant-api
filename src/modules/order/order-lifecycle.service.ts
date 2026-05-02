import { Types } from 'mongoose';
import { OrderEntity, OrderItemEntity } from '@modules/order/order.model';
import { 
  ORDER_STATUS, 
  SETTLEMENT_STATUS, 
  ITEM_STATUS,
  ORDER_TYPE 
} from '@modules/order/order.types';
import TableEntity from '@modules/table/table.model';
import { TABLE_STATUS } from '@modules/table/table.types';
import { logOrderAction } from '@modules/order/order-audit.service';
import { ORDER_AUDIT_ACTION } from '@modules/order/order-audit.model';
import { orderEvents } from '@shared/events/order.events';
import OutletEntity from '@modules/outlet/outlet.model';

/**
 * Validates if an order meets conditions to be automatically closed:
 * 1. Payment is fully completed
 * 2. All active items are fully processed (SERVED)
 */
export const checkAndAutoCloseOrder = async (
  brandId: string,
  outletId: string,
  orderId: string,
  performedBy?: string
) => {
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!order || ![ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS].includes(order.status)) {
    return false;
  }

  // Condition 1: Payment must be fully completed or settled
  if (order.settlementStatus === SETTLEMENT_STATUS.UNSETTLED) {
    return false;
  }

  // Check outlet settings for KOT
  const outlet = await OutletEntity.findOne({
    _id: new Types.ObjectId(outletId),
    brandId: new Types.ObjectId(brandId)
  }).lean();
  
  const isKotEnabled = outlet?.settings?.kotSettings?.isKotEnabled ?? true;

  if (isKotEnabled) {
    // Condition 2: All items must be fully processed
    const pendingItemsCount = await OrderItemEntity.countDocuments({
      orderId: order._id,
      itemStatus: { $nin: [ITEM_STATUS.SERVED, ITEM_STATUS.CANCELLED] },
      isDelete: false
    });

    if (pendingItemsCount > 0) {
      return false;
    }
  }

  // Both conditions met (or KOT disabled and paid), auto-close the order
  await OrderEntity.updateOne(
    { _id: order._id },
    {
      $set: {
        status: ORDER_STATUS.COMPLETED,
        closedAt: new Date()
      }
    }
  );

  // Update table status to CLEANING
  if (order.tableId) {
    await TableEntity.findByIdAndUpdate(order.tableId, { status: TABLE_STATUS.CLEANING });
  }

  if (!isKotEnabled) {
    await OrderItemEntity.updateMany(
      { orderId: order._id, itemStatus: { $ne: ITEM_STATUS.CANCELLED }, isDelete: false },
      { $set: { itemStatus: ITEM_STATUS.SERVED } }
    );
  }

  const userIdStr = performedBy ? String(performedBy) : null;
  logOrderAction({
    brandId,
    outletId,
    orderId: String(order._id),
    action: ORDER_AUDIT_ACTION.ORDER_CLOSED,
    performedBy: userIdStr,
    metadata: { reason: 'auto_closed', isKotEnabled }
  });
  orderEvents.emit('order.closed', { orderId: String(order._id), brandId, outletId });

  return true;
};
