import mongoose, { Types, type FilterQuery } from 'mongoose';

import { KOTEntity } from '@modules/kot/kot.model';
import { generateKOT } from '@modules/kot/kot.service';
import { KOT_STATUS, KOT_TYPE, type KOT } from '@modules/kot/kot.types';
import AddonEntity from '@modules/menu/addons/addon.model';
import type { AddonItem } from '@modules/menu/addons/addon.types';
import MenuItemVariantEntity from '@modules/menu/menu-item-variants/menu-item-variant.model';
import MenuItemEntity from '@modules/menu/menu-items/menu-item.model';
import DailySequenceEntity from '@modules/order/daily-sequence.model';
import { ORDER_AUDIT_ACTION } from '@modules/order/order-audit.model';
import { logOrderAction } from '@modules/order/order-audit.service';
import { OrderEntity, OrderItemEntity, OrderItemAddonEntity } from '@modules/order/order.model';
import OutletEntity from '@modules/outlet/outlet.model';
import {
  ORDER_STATUS,
  ORDER_TYPE,
  ITEM_STATUS,
  type CreateOrderDTO,
  type AddItemToOrderDTO,
  type AddItemsToOrderDTO,
  type RemoveOrderItemDTO,
  type UpdateOrderItemDTO,
  type CloseOrderDTO,
  type CancelOrderDTO,
  type Order,
  type OrderListQuery,
  type OrderItemAddon,
  type ProcessedOrderItem,
  type ProcessedOrderItemAddon
} from '@modules/order/order.types';
import TableEntity from '@modules/table/table.model';
import { TABLE_STATUS } from '@modules/table/table.types';

import { orderEvents } from '@shared/events/order.events';
import type { TokenDisplayItem, TokenDisplayResponse } from '@shared/interfaces';


// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayStr = () => new Date().toISOString().split('T')[0];

/** Atomically get next daily sequence number for a given type */
const getNextSequence = async (
  brandId: string,
  outletId: string,
  type: 'ORDER' | 'KOT' | 'TOKEN'
): Promise<number> => {
  const doc = await DailySequenceEntity.findOneAndUpdate(
    {
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      date: getTodayStr(),
      type
    },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

/**
 * Batch-fetch all menu items, variants, and addons referenced in the item list.
 * Returns lookup Maps keyed by string ID — eliminates N+1 queries.
 */
const batchFetchMenuData = async (items: AddItemToOrderDTO[]) => {
  const menuItemIds = [...new Set(items.map(i => i.menuItemId))];
  const variantIds = [...new Set(items.filter(i => i.variationId).map(i => i.variationId!))];
  const addonIds = [...new Set(items.flatMap(i => (i.addons ?? []).map(a => a.addonId)))];

  const [menuItems, variants, addons] = await Promise.all([
    MenuItemEntity.find({ _id: { $in: menuItemIds }, isDelete: false }).lean(),
    variantIds.length
      ? MenuItemVariantEntity.find({
        $or: [
          { _id: { $in: variantIds } },
          { variationId: { $in: variantIds } }
        ]
      })
        .populate('variationId', 'name')
        .lean()
      : [],
    addonIds.length ? AddonEntity.find({ _id: { $in: addonIds } }).lean() : []
  ]);

  return {
    menuItemMap: new Map(menuItems.map(m => [String(m._id), m])),
    variants, // Return raw array for secondary lookup
    variantMap: new Map(variants.map((v: any) => [String(v._id), v])),
    addonMap: new Map(addons.map((a: any) => [String(a._id), a]))
  };
};

/**
 * Process items into DB-ready objects, computing prices from pre-fetched maps.
 */
const processItems = (
  items: AddItemToOrderDTO[],
  brandId: string,
  outletId: string,
  menuItemMap: Map<string, any>,
  variantMap: Map<string, any>,
  variants: any[],
  addonMap: Map<string, any>
): {
  processedItems: ProcessedOrderItem[];
  processedAddons: ProcessedOrderItemAddon[];
  subtotal: number;
} => {
  let subtotal = 0;
  const processedItems: ProcessedOrderItem[] = [];
  const processedAddons: ProcessedOrderItemAddon[] = [];

  for (const item of items) {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) throw { status: 404, message: `MenuItem ${item.menuItemId} not found` };

    let variationName: string | null = null;
    let basePrice = menuItem.basePrice || 0;

    if (item.variationId) {
      // 1. Try direct ID match (MenuItemVariant ID)
      let variant = variantMap.get(item.variationId);

      // 2. Try shared Variation ID match within the scope of this MenuItem
      if (!variant) {
        variant = variants.find(
          (v) => String(v.variationId?._id || v.variationId) === String(item.variationId) &&
            String(v.menuItemId) === String(item.menuItemId)
        );
      }

      if (!variant) throw { status: 404, message: `Variation ${item.variationId} not found` };
      basePrice = variant.basePrice ?? menuItem.basePrice ?? 0;
      variationName = (variant.variationId as any)?.name || null;
    }

    const currentItemId = new Types.ObjectId();
    let itemTotal = basePrice * item.quantity;

    if (item.addons && item.addons.length > 0) {
      for (const addonDto of item.addons) {
        const addonDoc = addonMap.get(addonDto.addonId);
        if (!addonDoc) throw { status: 404, message: `Addon ${addonDto.addonId} not found` };

        const addonItemDoc = addonDoc.items?.find(
          (i: AddonItem) => String(i._id) === String(addonDto.addonItemId)
        );
        if (!addonItemDoc)
          throw {
            status: 404,
            message: `AddonItem ${addonDto.addonItemId} not found in addon ${addonDto.addonId}`
          };

        const addonPrice = addonItemDoc.price || 0;
        itemTotal += addonPrice * addonDto.quantity * item.quantity;

        processedAddons.push({
          _id: new Types.ObjectId(),
          brandId: new Types.ObjectId(brandId),
          outletId: new Types.ObjectId(outletId),
          orderItemId: currentItemId,
          addonId: new Types.ObjectId(addonDto.addonId),
          addonItemId: new Types.ObjectId(addonDto.addonItemId),
          addonName: addonDoc.name,
          addonItemName: addonItemDoc.name,
          price: addonPrice,
          quantity: addonDto.quantity,
          isActive: true,
          isDelete: false
        });
      }
    }

    subtotal += itemTotal;

    processedItems.push({
      _id: currentItemId,
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      menuItemId: new Types.ObjectId(item.menuItemId),
      itemName: menuItem.name,
      basePrice,
      quantity: item.quantity,
      variationId: item.variationId ? new Types.ObjectId(item.variationId) : null,
      variationName,
      instruction: item.instruction || null,
      totalPrice: itemTotal,
      itemStatus: ITEM_STATUS.PENDING,
      kotSentAt: null,
      isActive: true,
      isDelete: false
    });
  }

  return { processedItems, processedAddons, subtotal };
};

// ─── Service Functions ────────────────────────────────────────────────────────

export const createOrder = async (
  brandId: string,
  outletId: string,
  userId: string,
  dto: CreateOrderDTO
) => {
  // Validation
  if (dto.orderType === ORDER_TYPE.DINE_IN && !dto.tableId) {
    throw { status: 400, message: 'tableId is required for DINE_IN orders' };
  }
  if (!userId) {
    throw { status: 400, message: 'Authenticated staff ID is required to create an order' };
  }
  if (!dto.items || dto.items.length === 0) {
    throw { status: 400, message: 'At least one item is required' };
  }

  // Batch-fetch menu data (no N+1)
  const { menuItemMap, variantMap, variants, addonMap } = await batchFetchMenuData(dto.items);

  // Process items
  const { processedItems, processedAddons, subtotal } = processItems(
    dto.items,
    brandId,
    outletId,
    menuItemMap,
    variantMap,
    variants,
    addonMap
  );

  const totalAmount = subtotal;

  // Atomic IDs and sequences
  const orderId = new Types.ObjectId();
  const orderSeq = await getNextSequence(brandId, outletId, 'ORDER');
  const todayStr = getTodayStr().replace(/-/g, '');
  const orderNumber = `ORD-${todayStr}-${String(orderSeq).padStart(4, '0')}`;

  // Token number
  let tokenNo: string | null = null;
  let tableName: string | null = null;

  if (dto.orderType === ORDER_TYPE.TAKEAWAY) {
    const tokenSeq = await getNextSequence(brandId, outletId, 'TOKEN');
    tokenNo = String(tokenSeq);
  } else if (dto.orderType === ORDER_TYPE.DINE_IN && dto.tableId) {
    const table = await TableEntity.findById(dto.tableId).lean();
    if (!table) throw { status: 404, message: 'Table not found' };
    tokenNo = table.name;
    tableName = table.name;
  }

  // ── Transaction ───────────────────────────────────────────────────────────
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orderDoc = {
      _id: orderId,
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      waiterId: new Types.ObjectId(userId),
      orderNumber,
      tokenNo,
      orderType: dto.orderType,
      tableId: dto.tableId ? new Types.ObjectId(dto.tableId) : null,
      status: ORDER_STATUS.OPEN,
      subtotal,
      discountAmount: 0,
      totalAmount,
      isActive: true,
      isDelete: false
    };

    await OrderEntity.create([orderDoc], { session });

    const now = new Date();
    const finalItems = processedItems.map(pi => ({
      ...pi,
      orderId,
      kotSentAt: now
    }));
    await OrderItemEntity.insertMany(finalItems, { session });

    if (processedAddons.length > 0) {
      const finalAddons = processedAddons.map(pa => ({ ...pa, orderId }));
      await OrderItemAddonEntity.insertMany(finalAddons, { session });
    }

    // Update table status
    if (dto.orderType === ORDER_TYPE.DINE_IN && dto.tableId) {
      await TableEntity.findByIdAndUpdate(
        dto.tableId,
        { status: TABLE_STATUS.OCCUPIED },
        { session }
      );
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Generate KOT (outside transaction — KOT failure should not roll back order)
  const kotItemsData = processedItems.map(fi => ({
    orderItemId: String(fi._id),
    quantity: fi.quantity
  }));
  await generateKOT(
    brandId,
    outletId,
    String(orderId),
    kotItemsData,
    tokenNo,
    tableName,
    userId,
    KOT_TYPE.REGULAR
  );

  // Audit + events (fire and forget)
  logOrderAction({
    brandId,
    outletId,
    orderId: String(orderId),
    action: ORDER_AUDIT_ACTION.ORDER_CREATED,
    performedBy: userId,
    metadata: { orderType: dto.orderType, itemCount: processedItems.length }
  });
  orderEvents.emit('order.created', { orderId: String(orderId), brandId, outletId, orderNumber });

  return getOrderById(brandId, outletId, String(orderId));
};

// ─────────────────────────────────────────────────────────────────────────────

export const addItemsToOrder = async (
  brandId: string,
  outletId: string,
  dto: AddItemsToOrderDTO
) => {
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
    status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] }
  }).lean();

  if (!order) throw { status: 404, message: 'Active order not found' };
  if (!dto.items || dto.items.length === 0)
    throw { status: 400, message: 'At least one item required' };

  const { menuItemMap, variantMap, variants, addonMap } = await batchFetchMenuData(dto.items);
  const {
    processedItems,
    processedAddons,
    subtotal: newSubtotal
  } = processItems(dto.items, brandId, outletId, menuItemMap, variantMap, variants, addonMap);

  const now = new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const finalItems = processedItems.map(pi => ({
      ...pi,
      orderId: order._id,
      kotSentAt: now
    }));
    await OrderItemEntity.insertMany(finalItems, { session });

    if (processedAddons.length > 0) {
      await OrderItemAddonEntity.insertMany(
        processedAddons.map(pa => ({ ...pa, orderId: order._id })),
        { session }
      );
    }

    // Atomic total update — no read-modify-write race condition
    await OrderEntity.updateOne(
      { _id: order._id },
      {
        $inc: {
          subtotal: newSubtotal,
          totalAmount: newSubtotal
        }
      },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Generate supplemental KOT
  let tableName: string | null = null;
  if (order.tableId) {
    const table = await TableEntity.findById(order.tableId).lean();
    if (table) tableName = table.name;
  }

  const kotItemsData = processedItems.map(fi => ({
    orderItemId: String(fi._id),
    quantity: fi.quantity
  }));
  await generateKOT(
    brandId,
    outletId,
    String(order._id),
    kotItemsData,
    order.tokenNo,
    tableName,
    order.waiterId ? String(order.waiterId) : undefined,
    KOT_TYPE.REGULAR
  );

  logOrderAction({
    brandId,
    outletId,
    orderId: dto.orderId,
    action: ORDER_AUDIT_ACTION.ITEMS_ADDED,
    performedBy: order.waiterId ? String(order.waiterId) : null,
    metadata: { addedCount: processedItems.length }
  });
  orderEvents.emit('order.items.added', { orderId: dto.orderId, brandId, outletId });

  return getOrderById(brandId, outletId, dto.orderId);
};

// ─────────────────────────────────────────────────────────────────────────────

export const removeItemFromOrder = async (
  brandId: string,
  outletId: string,
  dto: RemoveOrderItemDTO,
  performedBy?: string
) => {
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
    status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] }
  }).lean();
  if (!order) throw { status: 404, message: 'Active order not found' };

  const orderItem = await OrderItemEntity.findOne({
    _id: new Types.ObjectId(dto.orderItemId),
    orderId: order._id,
    isDelete: false
  }).lean();
  if (!orderItem) throw { status: 404, message: 'Order item not found' };
  if (orderItem.itemStatus === ITEM_STATUS.CANCELLED) {
    throw { status: 400, message: 'Item is already cancelled' };
  }
  if (orderItem.itemStatus === ITEM_STATUS.SERVED) {
    throw { status: 400, message: 'Cannot cancel an already served item' };
  }

  const now = new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Mark item cancelled
    await OrderItemEntity.updateOne(
      { _id: orderItem._id },
      {
        $set: {
          itemStatus: ITEM_STATUS.CANCELLED,
          cancelReason: dto.cancelReason || null,
          cancelledAt: now,
          cancelledBy: performedBy ? new Types.ObjectId(performedBy) : null
        }
      },
      { session }
    );

    // Recalculate order totals (subtract this item's price)
    const removedSubtotal = orderItem.totalPrice;

    await OrderEntity.updateOne(
      { _id: order._id },
      {
        $inc: {
          subtotal: -removedSubtotal,
          totalAmount: -removedSubtotal
        }
      },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Generate VOID KOT to signal kitchen to stop
  await generateKOT(
    brandId,
    outletId,
    dto.orderId,
    [{ orderItemId: dto.orderItemId, quantity: orderItem.quantity }],
    order.tokenNo,
    null,
    performedBy,
    KOT_TYPE.VOID
  );

  logOrderAction({
    brandId,
    outletId,
    orderId: dto.orderId,
    action: ORDER_AUDIT_ACTION.ITEM_CANCELLED,
    performedBy: performedBy || null,
    metadata: {
      orderItemId: dto.orderItemId,
      reason: dto.cancelReason,
      itemName: orderItem.itemName
    }
  });
  orderEvents.emit('order.item.cancelled', {
    orderId: dto.orderId,
    orderItemId: dto.orderItemId,
    brandId,
    outletId
  });

  return getOrderById(brandId, outletId, dto.orderId);
};

// ─────────────────────────────────────────────────────────────────────────────

export const updateOrderItem = async (
  brandId: string,
  outletId: string,
  dto: UpdateOrderItemDTO,
  performedBy?: string
) => {
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
    status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] }
  }).lean();
  if (!order) throw { status: 404, message: 'Active order not found' };

  const orderItem = await OrderItemEntity.findOne({
    _id: new Types.ObjectId(dto.orderItemId),
    orderId: order._id,
    isDelete: false
  }).lean();
  if (!orderItem) throw { status: 404, message: 'Order item not found' };
  if (orderItem.itemStatus !== ITEM_STATUS.PENDING) {
    throw { status: 400, message: 'Only PENDING items can be modified' };
  }

  const updateFields: Record<string, unknown> = {};
  if (dto.instruction !== undefined) updateFields.instruction = dto.instruction;

  let priceDelta = 0;
  let quantityDelta = 0;

  if (dto.quantity !== undefined && dto.quantity !== orderItem.quantity) {
    if (dto.quantity < 1) throw { status: 400, message: 'Quantity must be at least 1' };
    quantityDelta = dto.quantity - orderItem.quantity;

    const oldTotal = orderItem.totalPrice;
    const pricePerUnit = orderItem.basePrice; // addons are per-item; simplified
    const newTotal = pricePerUnit * dto.quantity;
    priceDelta = newTotal - oldTotal;
    updateFields.quantity = dto.quantity;
    updateFields.totalPrice = newTotal;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await OrderItemEntity.updateOne({ _id: orderItem._id }, { $set: updateFields }, { session });

    if (priceDelta !== 0) {
      await OrderEntity.updateOne(
        { _id: order._id },
        { $inc: { subtotal: priceDelta, totalAmount: priceDelta } },
        { session }
      );
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  if (quantityDelta !== 0) {
    let tableName: string | null = null;
    if (order.tableId) {
      const table = await TableEntity.findById(order.tableId).lean();
      if (table) tableName = table.name;
    }

    const kotType = quantityDelta > 0 ? KOT_TYPE.REGULAR : KOT_TYPE.VOID;
    const kotQty = Math.abs(quantityDelta);

    await generateKOT(
      brandId,
      outletId,
      String(order._id),
      [{ orderItemId: String(orderItem._id), quantity: kotQty }],
      order.tokenNo,
      tableName,
      performedBy,
      kotType
    );
  }

  logOrderAction({
    brandId,
    outletId,
    orderId: dto.orderId,
    action: ORDER_AUDIT_ACTION.ITEM_UPDATED,
    performedBy: performedBy || null,
    metadata: { orderItemId: dto.orderItemId, changes: dto, quantityDelta }
  });
  orderEvents.emit('order.item.updated', {
    orderId: dto.orderId,
    orderItemId: dto.orderItemId,
    brandId,
    outletId,
    quantityDelta
  });

  return getOrderById(brandId, outletId, dto.orderId);
};

// ─────────────────────────────────────────────────────────────────────────────

export const getOrderById = async (brandId: string, outletId: string, orderId: string) => {
  const order = await OrderEntity.findOne({
    _id: new Types.ObjectId(orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  })
    .populate('tableId', 'name')
    .populate('waiterId', 'name role')
    .populate('cancelledBy', 'name')
    .lean();

  if (!order) return null;

  const [items, addons] = await Promise.all([
    OrderItemEntity.find({ orderId: order._id, isDelete: false }).lean(),
    OrderItemAddonEntity.find({ orderId: order._id, isDelete: false }).lean()
  ]);

  const formattedItems = items.map(item => ({
    ...item,
    addons: addons.filter(addon => String(addon.orderItemId) === String(item._id))
  }));

  return { ...order, items: formattedItems };
};

// ─────────────────────────────────────────────────────────────────────────────

export const closeOrder = async (
  brandId: string,
  outletId: string,
  dto: CloseOrderDTO,
  performedBy?: string
) => {
  const currentOrder = await OrderEntity.findOne({
    _id: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!currentOrder) throw { status: 404, message: 'Order not found' };

  // Status guard
  if (![ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS].includes(currentOrder.status)) {
    throw {
      status: 400,
      message: `Cannot close an order with status: ${ORDER_STATUS[currentOrder.status]}`
    };
  }

  // Payment guard — allow close only if payment is recorded
  if (currentOrder.paymentStatus === 1 /* UNPAID */) {
    throw {
      status: 400,
      message: 'Order cannot be closed without payment. Record payment first.'
    };
  }

  const updateFields: Record<string, unknown> = {
    status: ORDER_STATUS.COMPLETED,
    closedAt: new Date()
  };
  if (dto.paymentMethod !== undefined) updateFields.paymentMethod = dto.paymentMethod;

  const order = await OrderEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(dto.orderId) },
    { $set: updateFields },
    { new: true }
  ).lean();

  if (!order) throw { status: 404, message: 'Order not found' };

  // Release table if no other active orders
  if (order.tableId) {
    const openOrdersCount = await OrderEntity.countDocuments({
      tableId: order.tableId,
      status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] },
      isDelete: false
    });
    if (openOrdersCount === 0) {
      await TableEntity.findByIdAndUpdate(order.tableId, { status: TABLE_STATUS.AVAILABLE });
    }
  }

  logOrderAction({
    brandId,
    outletId,
    orderId: dto.orderId,
    action: ORDER_AUDIT_ACTION.ORDER_CLOSED,
    performedBy: performedBy || null
  });
  orderEvents.emit('order.closed', { orderId: dto.orderId, brandId, outletId });

  return order;
};

// ─────────────────────────────────────────────────────────────────────────────

export const cancelOrder = async (
  brandId: string,
  outletId: string,
  dto: CancelOrderDTO,
  performedBy?: string
) => {
  const currentOrder = await OrderEntity.findOne({
    _id: new Types.ObjectId(dto.orderId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!currentOrder) throw { status: 404, message: 'Order not found' };

  // Status guard — only OPEN or IN_PROGRESS can be cancelled
  if (![ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS].includes(currentOrder.status)) {
    throw {
      status: 400,
      message: `Cannot cancel an order with status: ${ORDER_STATUS[currentOrder.status]}`
    };
  }

  const order = await OrderEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(dto.orderId) },
    {
      $set: {
        status: ORDER_STATUS.CANCELLED,
        cancellationReason: dto.cancellationReason || null,
        cancelledBy: performedBy ? new Types.ObjectId(performedBy) : null,
        closedAt: new Date()
      }
    },
    { new: true }
  ).lean();

  if (!order) throw { status: 404, message: 'Order not found' };

  if (order.tableId) {
    const openOrdersCount = await OrderEntity.countDocuments({
      tableId: order.tableId,
      status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] },
      isDelete: false
    });
    if (openOrdersCount === 0) {
      await TableEntity.findByIdAndUpdate(order.tableId, { status: TABLE_STATUS.AVAILABLE });
    }
  }

  // Cancel all active KOTs for this order
  await KOTEntity.updateMany(
    {
      orderId: new Types.ObjectId(dto.orderId),
      brandId: new Types.ObjectId(brandId),
      status: { $in: [KOT_STATUS.PENDING, KOT_STATUS.PREPARING] }
    },
    { $set: { status: KOT_STATUS.CANCELLED } }
  );

  logOrderAction({
    brandId,
    outletId,
    orderId: dto.orderId,
    action: ORDER_AUDIT_ACTION.ORDER_CANCELLED,
    performedBy: performedBy || null,
    metadata: { reason: dto.cancellationReason }
  });
  orderEvents.emit('order.cancelled', { orderId: dto.orderId, brandId, outletId });

  return order;
};

// ─────────────────────────────────────────────────────────────────────────────

export const listOrders = async (
  brandId: string,
  outletId: string,
  query: OrderListQuery | Record<string, never> = {}
) => {
  const filter: FilterQuery<Order> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  };

  if (query.status) filter.status = Number(query.status);
  if (query.orderType) filter.orderType = Number(query.orderType);
  if (query.tableId) filter.tableId = new Types.ObjectId(query.tableId);
  if (query.waiterId) filter.waiterId = new Types.ObjectId(query.waiterId);
  if (query.orderNumber)
    filter.orderNumber = { $regex: new RegExp(String(query.orderNumber), 'i') };

  // Date range filter
  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.$lte = new Date(query.toDate);
  }

  const limit = Math.max(1, Number(query.limit) || 20);
  const skip = (Math.max(1, Number(query.page) || 1) - 1) * limit;

  const [items, total] = await Promise.all([
    OrderEntity.find(filter)
      .populate('tableId', 'name')
      .populate('waiterId', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    OrderEntity.countDocuments(filter)
  ]);

  return { items, total };
};

// ─────────────────────────────────────────────────────────────────────────────

export const getTokenDisplay = async (brandId: string, outletId: string) => {
  const activeOrders = await OrderEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    orderType: ORDER_TYPE.TAKEAWAY,
    status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] },
    isDelete: false
  }).lean();

  if (!activeOrders.length) return { preparing: [], ready: [] };

  const orderIds = activeOrders.map(o => o._id);
  const kots = await KOTEntity.find({
    orderId: { $in: orderIds },
    isDelete: false
  }).lean();

  const preparing: TokenDisplayItem[] = [];
  const ready: TokenDisplayItem[] = [];

  for (const order of activeOrders) {
    const orderKots = kots.filter((k: KOT) => String(k.orderId) === String(order._id));
    if (orderKots.length === 0) continue;

    const isPreparing = orderKots.some(
      (k: KOT) => k.status === KOT_STATUS.PENDING || k.status === KOT_STATUS.PREPARING
    );

    if (isPreparing) {
      preparing.push({
        tokenNo: order.tokenNo,
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    } else {
      ready.push({ tokenNo: order.tokenNo, orderId: order._id, orderNumber: order.orderNumber });
    }
  }

  return { preparing, ready } as TokenDisplayResponse;
};
