import { Types } from 'mongoose';

import { KOTEntity, KOTItemEntity } from '@modules/kot/kot.model';
import { KOT_STATUS, KOT_TYPE, ITEM_STATUS } from '@modules/kot/kot.types';
import DailySequenceEntity from '@modules/order/daily-sequence.model';
import { ORDER_AUDIT_ACTION } from '@modules/order/order-audit.model';
import { logOrderAction } from '@modules/order/order-audit.service';
import { OrderEntity } from '@modules/order/order.model';
import { OrderItemEntity } from '@modules/order/order.model';
import { checkAndAutoCloseOrder } from '@modules/order/order.service';
import { ORDER_STATUS } from '@modules/order/order.types';

import { orderEvents } from '@shared/events/order.events';

// ─── KOT Status State Machine ─────────────────────────────────────────────────

/**
 * Valid forward transitions. CANCELLED is reachable from any active state.
 * VOID and REPRINT KOTs go directly to their final states.
 */
const VALID_TRANSITIONS: Record<number, number[]> = {
  [KOT_STATUS.PENDING]: [KOT_STATUS.PREPARING, KOT_STATUS.CANCELLED],
  [KOT_STATUS.PREPARING]: [KOT_STATUS.READY, KOT_STATUS.CANCELLED],
  [KOT_STATUS.READY]: [KOT_STATUS.SERVED, KOT_STATUS.CANCELLED],
  [KOT_STATUS.SERVED]: [], // terminal
  [KOT_STATUS.CANCELLED]: [] // terminal
};

const KOT_STATUS_NAMES: Record<number, string> = {
  [KOT_STATUS.PENDING]: 'PENDING',
  [KOT_STATUS.PREPARING]: 'PREPARING',
  [KOT_STATUS.READY]: 'READY',
  [KOT_STATUS.SERVED]: 'SERVED',
  [KOT_STATUS.CANCELLED]: 'CANCELLED'
};

/** Atomically get next daily sequence number */
const getNextKotSeq = async (brandId: string, outletId: string): Promise<number> => {
  const doc = await DailySequenceEntity.findOneAndUpdate(
    {
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      date: new Date().toISOString().split('T')[0],
      type: 'KOT'
    },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

// ─── Service Functions ────────────────────────────────────────────────────────

export const generateKOT = async (
  brandId: string,
  outletId: string,
  orderId: string,
  items: { orderItemId: string; quantity: number }[],
  tokenNo?: string | null,
  tableName?: string | null,
  waiterId?: string | null,
  kotType: KOT_TYPE = KOT_TYPE.REGULAR
) => {
  if (!items || items.length === 0) return null;

  const orderObjectId = new Types.ObjectId(orderId);
  const brandObjectId = new Types.ObjectId(brandId);
  const outletObjectId = new Types.ObjectId(outletId);

  const [order, orderItems] = await Promise.all([
    OrderEntity.findOne({
      _id: orderObjectId,
      brandId: brandObjectId,
      outletId: outletObjectId,
      isDelete: false
    })
      .select('notes')
      .lean(),
    OrderItemEntity.find({
      _id: { $in: items.map(item => new Types.ObjectId(item.orderItemId)) },
      isDelete: false
    })
      .select('instruction')
      .lean()
  ]);

  const instructionMap = new Map<string, string | null>();
  for (const orderItem of orderItems) {
    const rawInstruction = (orderItem as any).instruction as string | null | undefined;
    if (typeof rawInstruction === 'string') {
      const trimmed = rawInstruction.trim();
      instructionMap.set(String(orderItem._id), trimmed.length > 0 ? trimmed : null);
    } else {
      instructionMap.set(String(orderItem._id), null);
    }
  }

  const seq = await getNextKotSeq(brandId, outletId);
  const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const kotNumber = `KOT-${todayStr}-${String(seq).padStart(4, '0')}`;

  const createdKOT = await KOTEntity.create({
    brandId: brandObjectId,
    outletId: outletObjectId,
    orderId: orderObjectId,
    kotNumber,
    kotType,
    waiterId: waiterId ? new Types.ObjectId(waiterId) : null,
    tokenNo: tokenNo || null,
    tableName: tableName || null,
    notes: order && typeof order.notes === 'string' && order.notes.trim().length > 0 ? order.notes.trim() : null,
    status: KOT_STATUS.PENDING,
    isActive: true,
    isDelete: false
  });

  const kotItemsToInsert = items.map(item => ({
    brandId: brandObjectId,
    outletId: outletObjectId,
    kotId: createdKOT._id,
    orderItemId: new Types.ObjectId(item.orderItemId),
    quantity: item.quantity,
    instruction: instructionMap.get(item.orderItemId) ?? null,
    itemStatus: ITEM_STATUS.PENDING,
    isActive: true,
    isDelete: false
  }));

  await KOTItemEntity.insertMany(kotItemsToInsert);

  orderEvents.emit('kot.created', {
    kotId: String(createdKOT._id),
    orderId,
    brandId,
    outletId,
    kotType,
    kotNumber
  });

  return createdKOT.toObject();
};

// ─────────────────────────────────────────────────────────────────────────────

export const listKOTsByOrder = async (brandId: string, outletId: string, orderId: string) => {
  const kots = await KOTEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    orderId: new Types.ObjectId(orderId),
    isDelete: false
  })
    .populate('waiterId', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  if (!kots.length) return [];

  const kotIds = kots.map(k => k._id);
  const kotItems = await KOTItemEntity.find({
    kotId: { $in: kotIds },
    isDelete: false
  })
    .populate('orderItemId', 'itemName instruction quantity variationName')
    .lean();

  return kots.map(kot => {
    const itemsForKot = kotItems.filter(item => String(item.kotId) === String(kot._id));
    const printLines: string[] = [];

    for (const item of itemsForKot) {
      const orderItem = item.orderItemId as any;
      const nameParts: string[] = [];
      if (orderItem && orderItem.itemName) nameParts.push(orderItem.itemName);
      if (orderItem && orderItem.variationName) nameParts.push(orderItem.variationName);
      const baseName = nameParts.join(' - ');
      const line = baseName ? `${baseName} x${item.quantity}` : `x${item.quantity}`;
      printLines.push(line);

      const rawInstruction =
        (item.instruction as string | null | undefined) ??
        (orderItem ? ((orderItem.instruction as string | null | undefined) ?? null) : null);
      if (typeof rawInstruction === 'string') {
        const trimmed = rawInstruction.trim();
        if (trimmed.length > 0) {
          printLines.push(`  ${trimmed}`);
        }
      }
    }

    const rawNotes = (kot as any).notes as string | null | undefined;
    if (typeof rawNotes === 'string') {
      const trimmedNotes = rawNotes.trim();
      if (trimmedNotes.length > 0) {
        if (printLines.length > 0) {
          printLines.push('');
        }
        printLines.push(`NOTE: ${trimmedNotes}`);
      }
    }

    return { ...kot, items: itemsForKot, printLines };
  });
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kitchen Display System — returns all non-terminal KOTs for an outlet.
 * Optionally filter by status. Sorted FIFO (oldest first).
 */
export const listAllKOTs = async (brandId: string, outletId: string, statusFilter?: KOT_STATUS) => {
  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  };

  if (statusFilter !== undefined) {
    filter.status = Number(statusFilter);
  } else {
    // KDS shows everything except served and cancelled by default
    filter.status = { $in: [KOT_STATUS.PENDING, KOT_STATUS.PREPARING, KOT_STATUS.READY] };
  }

  const kots = await KOTEntity.find(filter)
    .populate('waiterId', 'name')
    .sort({ createdAt: 1 })
    .lean();

  if (!kots.length) return [];

  const kotIds = kots.map(k => k._id);
  const kotItems = await KOTItemEntity.find({ kotId: { $in: kotIds }, isDelete: false })
    .populate('orderItemId', 'itemName instruction quantity variationName')
    .lean();

  return kots.map(kot => {
    const itemsForKot = kotItems.filter(item => String(item.kotId) === String(kot._id));
    const printLines: string[] = [];

    for (const item of itemsForKot) {
      const orderItem = item.orderItemId as any;
      const nameParts: string[] = [];
      if (orderItem && orderItem.itemName) nameParts.push(orderItem.itemName);
      if (orderItem && orderItem.variationName) nameParts.push(orderItem.variationName);
      const baseName = nameParts.join(' - ');
      const line = baseName ? `${baseName} x${item.quantity}` : `x${item.quantity}`;
      printLines.push(line);

      const rawInstruction =
        (item.instruction as string | null | undefined) ??
        (orderItem ? ((orderItem.instruction as string | null | undefined) ?? null) : null);
      if (typeof rawInstruction === 'string') {
        const trimmed = rawInstruction.trim();
        if (trimmed.length > 0) {
          printLines.push(`  ${trimmed}`);
        }
      }
    }

    const rawNotes = (kot as any).notes as string | null | undefined;
    if (typeof rawNotes === 'string') {
      const trimmedNotes = rawNotes.trim();
      if (trimmedNotes.length > 0) {
        if (printLines.length > 0) {
          printLines.push('');
        }
        printLines.push(`NOTE: ${trimmedNotes}`);
      }
    }

    return { ...kot, items: itemsForKot, printLines };
  });
};

// ─────────────────────────────────────────────────────────────────────────────

export const updateKOTStatus = async (
  brandId: string,
  outletId: string,
  kotId: string,
  status: KOT_STATUS
) => {
  const kot = await KOTEntity.findOne({
    _id: new Types.ObjectId(kotId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId), // ← outletId scoped
    isDelete: false
  }).lean();

  if (!kot) throw { status: 404, message: 'KOT not found' };

  // State-transition guard
  const allowed = VALID_TRANSITIONS[kot.status] ?? [];
  if (!allowed.includes(status)) {
    throw {
      status: 400,
      message: `Invalid KOT status transition: ${KOT_STATUS_NAMES[kot.status]} → ${KOT_STATUS_NAMES[status] ?? status}`
    };
  }

  const updated = await KOTEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(kotId) },
    { $set: { status } },
    { new: true }
  ).lean();

  if (!updated) throw { status: 404, message: 'KOT not found' };

  // Bubble up to Order: any KOT going to PREPARING/READY moves order to IN_PROGRESS
  if (status === KOT_STATUS.PREPARING || status === KOT_STATUS.READY) {
    await OrderEntity.updateOne(
      {
        _id: updated.orderId,
        brandId: new Types.ObjectId(brandId),
        status: ORDER_STATUS.OPEN,
        isDelete: false
      },
      { $set: { status: ORDER_STATUS.IN_PROGRESS } }
    );
  }

  // When KOT is SERVED, mark all its items and corresponding OrderItems as SERVED
  if (status === KOT_STATUS.SERVED) {
    const kotItems = await KOTItemEntity.find({
      kotId: new Types.ObjectId(kotId),
      isDelete: false
    }).lean();

    const orderItemIds = kotItems.map(item => item.orderItemId);

    await Promise.all([
      KOTItemEntity.updateMany(
        { kotId: new Types.ObjectId(kotId), isDelete: false },
        { $set: { itemStatus: ITEM_STATUS.SERVED, servedAt: new Date() } }
      ),
      OrderItemEntity.updateMany(
        { _id: { $in: orderItemIds }, isDelete: false },
        { $set: { itemStatus: ITEM_STATUS.SERVED } }
      )
    ]);

    // Check if entire order can be closed (all items served + payment settled)
    await checkAndAutoCloseOrder(brandId, outletId, String(updated.orderId));
  }

  logOrderAction({
    brandId,
    outletId,
    orderId: String(updated.orderId),
    action: ORDER_AUDIT_ACTION.KOT_STATUS_UPDATED,
    metadata: { kotId, from: KOT_STATUS_NAMES[kot.status], to: KOT_STATUS_NAMES[status] }
  });

  orderEvents.emit('kot.status.updated', {
    kotId,
    orderId: String(updated.orderId),
    brandId,
    outletId,
    status
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the status of an individual KOT item.
 * If all items in the KOT reach SERVED, auto-advance KOT to SERVED.
 */
export const updateKOTItemStatus = async (
  brandId: string,
  outletId: string,
  kotItemId: string,
  status: ITEM_STATUS
) => {
  const kotItem = await KOTItemEntity.findOne({
    _id: new Types.ObjectId(kotItemId),
    isDelete: false
  }).lean();

  if (!kotItem) throw { status: 404, message: 'KOT item not found' };

  // Verify KOT belongs to this outlet
  const kot = await KOTEntity.findOne({
    _id: kotItem.kotId,
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  }).lean();

  if (!kot) throw { status: 403, message: 'Access denied: KOT not found in your outlet' };

  const updateFields: Record<string, unknown> = { itemStatus: status };
  if (status === ITEM_STATUS.READY) updateFields.preparedAt = new Date();
  if (status === ITEM_STATUS.SERVED) updateFields.servedAt = new Date();

  await KOTItemEntity.updateOne({ _id: new Types.ObjectId(kotItemId) }, { $set: updateFields });

  // Mirror status on the corresponding OrderItem
  await OrderItemEntity.updateOne({ _id: kotItem.orderItemId }, { $set: { itemStatus: status } });

  // Auto-advance KOT if all items are SERVED
  if (status === ITEM_STATUS.SERVED) {
    const remainingItems = await KOTItemEntity.countDocuments({
      kotId: kotItem.kotId,
      itemStatus: { $nin: [ITEM_STATUS.SERVED, ITEM_STATUS.CANCELLED] },
      isDelete: false
    });

    if (remainingItems === 0) {
      await KOTEntity.updateOne(
        { _id: kotItem.kotId, status: { $ne: KOT_STATUS.SERVED } },
        { $set: { status: KOT_STATUS.SERVED } }
      );
    }

    // Evaluate auto-close: if all KOT items are served, and order is fully paid, close it.
    await checkAndAutoCloseOrder(brandId, outletId, String(kot.orderId));
  }

  orderEvents.emit('kot.item.status.updated', {
    kotItemId,
    kotId: String(kotItem.kotId),
    brandId,
    outletId,
    status
  });

  return KOTItemEntity.findById(kotItemId).lean();
};
