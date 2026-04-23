import mongoose, { Types, type FilterQuery } from 'mongoose';

import { customerService } from '@modules/customer/customer.service';
import { discountService } from '@modules/discount/discount.service';
import { KOTEntity } from '@modules/kot/kot.model';
import { generateKOT } from '@modules/kot/kot.service';
import { KOT_STATUS, KOT_TYPE, type KOT } from '@modules/kot/kot.types';
import MeasurementEntity from '@modules/measurement/measurement.model';
import AddonEntity from '@modules/menu/addons/addon.model';
import type { AddonItem } from '@modules/menu/addons/addon.types';
import MenuItemVariantEntity from '@modules/menu/menu-item-variants/menu-item-variant.model';
import MenuItemEntity from '@modules/menu/menu-items/menu-item.model';
import DailySequenceEntity from '@modules/order/daily-sequence.model';
import { ORDER_AUDIT_ACTION } from '@modules/order/order-audit.model';
import { logOrderAction } from '@modules/order/order-audit.service';
import { OrderEntity, OrderItemEntity, OrderItemAddonEntity } from '@modules/order/order.model';
import {
  ORDER_STATUS,
  ORDER_TYPE,
  ITEM_STATUS,
  PAYMENT_STATUS,
  type CreateOrderDTO,
  type PreviewOrderDTO,
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
  type ProcessedOrderItemAddon,
  type MeasurementSelectionDTO,
  type KOTFriendlyResponse,
  type KOTFriendlyBatch
} from '@modules/order/order.types';
import OutletEntity from '@modules/outlet/outlet.model';
import TableEntity from '@modules/table/table.model';
import { calculateLineTax, summarizeOrderTaxes } from '@modules/tax/tax-calculation.service';
import { resolveEffectiveTaxesForMenuItems } from '@modules/tax/tax-resolution.service';
import { CUSTOMER_TAG_DISCOUNT_TYPE } from '@modules/tag/tag.types';
import { TABLE_STATUS } from '@modules/table/table.types';

import { orderEvents } from '@shared/events/order.events';
import type { TokenDisplayItem, TokenDisplayResponse } from '@shared/interfaces';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayStr = () => new Date().toISOString().split('T')[0];

const mapDiscountTypeToOrderValue = (discountType?: string | null): number | null => {
  if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.FLAT) {
    return 1;
  }

  if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.PERCENTAGE) {
    return 2;
  }

  return null;
};

const recalculateOrderPricing = async (
  brandId: string,
  outletId: string,
  customerId: Types.ObjectId | null | undefined,
  subtotal: number
) => {
  if (!customerId) {
    return {
      discountAmount: 0,
      discountType: null,
      discountValue: null,
      totalAmount: subtotal
    };
  }

  const { discount, appliedTag } = await discountService.calculateBestDiscount(
    String(customerId),
    subtotal,
    brandId,
    outletId
  );

  return {
    discountAmount: discount,
    discountType: mapDiscountTypeToOrderValue(appliedTag?.discountType ?? null),
    discountValue: appliedTag?.discountValue ?? null,
    totalAmount: Math.max(0, subtotal - discount)
  };
};

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
        $or: [{ _id: { $in: variantIds } }, { variationId: { $in: variantIds } }]
      })
        .populate('variationId', 'name')
        .lean()
      : [],
    addonIds.length ? AddonEntity.find({ _id: { $in: addonIds } }).lean() : []
  ]);

  // Collect measurement IDs
  const measurementIds = new Set<string>();
  menuItems.forEach((m: any) => {
    if (m.measurementConfig?.measurementId)
      measurementIds.add(String(m.measurementConfig.measurementId));
  });
  variants.forEach((v: any) => {
    if (v.measurementConfig?.measurementId)
      measurementIds.add(String(v.measurementConfig.measurementId));
  });

  const measurements = measurementIds.size
    ? await MeasurementEntity.find({ _id: { $in: [...measurementIds] } }).lean()
    : [];

  return {
    menuItemMap: new Map(menuItems.map(m => [String(m._id), m])),
    variants, // Return raw array for secondary lookup
    variantMap: new Map(variants.map((v: any) => [String(v._id), v])),
    addonMap: new Map(addons.map((a: any) => [String(a._id), a])),
    measurementMap: new Map(measurements.map((m: any) => [String(m._id), m]))
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
  addonMap: Map<string, any>,
  measurementMap: Map<string, any>
): {
  processedItems: ProcessedOrderItem[];
  processedAddons: ProcessedOrderItemAddon[];
  subtotal: number;
} => {
  let subtotal = 0;
  const processedItems: ProcessedOrderItem[] = [];
  const processedAddons: ProcessedOrderItemAddon[] = [];

  for (const item of items) {
    // Legacy frontend support: extract measurement from instruction
    if (!item.measurement && item.instruction?.startsWith('MEAS:')) {
      try {
        const parsed = JSON.parse(item.instruction.substring(5));
        item.measurement = parsed.measurement || parsed;
        item.instruction = undefined; // Clear the hacky instruction
      } catch (e) {
        // Ignore JSON parse errors, validation will catch missing measurement later
      }
    }

    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) throw { status: 404, message: `MenuItem ${item.menuItemId} not found` };

    let variationName: string = '';
    let variant: any = null;
    let measurementConfig: any = null;
    let isMeasurementItem = false;

    // 1. Resolve Variation & Measurement Config
    if (item.variationId) {
      // Try direct ID match (MenuItemVariant ID)
      variant = variantMap.get(item.variationId);

      // Try shared Variation ID match within the scope of this MenuItem
      if (!variant) {
        variant = variants.find(
          v =>
            String(v.variationId?._id || v.variationId) === String(item.variationId) &&
            String(v.menuItemId) === String(item.menuItemId)
        );
      }

      if (!variant) throw { status: 404, message: `Variation ${item.variationId} not found` };
      variationName = (variant.variationId as any)?.name || undefined;

      // Check for measurement config in variation (Priority 1)
      if (variant.isMeasurementBased && variant.measurementConfig) {
        measurementConfig = variant.measurementConfig;
        isMeasurementItem = true;
      }
    }

    // 2. Check for measurement config in menu item (Priority 2)
    if (!isMeasurementItem && menuItem.isMeasurementBased && menuItem.measurementConfig) {
      measurementConfig = menuItem.measurementConfig;
      isMeasurementItem = true;
    }

    let basePrice = 0;
    let itemTotal = 0;
    let addonTotal = 0;
    let finalQuantity = item.quantity || 1;
    let measurementSnapshot: MeasurementSelectionDTO | undefined = undefined;

    if (isMeasurementItem) {
      if (!item.measurement) {
        throw { status: 400, message: `Measurement details required for ${menuItem.name}` };
      }

      const config = measurementConfig;
      basePrice = config.basePrice || 0;
      const baseValue = config.baseValue || 1;
      const enteredQuantity = item.measurement.enteredQuantity;

      const measurementDoc = measurementMap.get(String(config.measurementId));

      let baseUnitQuantity = enteredQuantity;
      let quantityInPrimaryUnit = enteredQuantity;

      if (measurementDoc) {
        const unitLower = (item.measurement.unit || '').toLowerCase();
        const primaryUnitLower = (measurementDoc.unit || '').toLowerCase();
        const baseUnitLower = (measurementDoc.baseUnit || '').toLowerCase();
        const conversionFactor = measurementDoc.conversionFactor || 1;

        if (unitLower === primaryUnitLower) {
          baseUnitQuantity = enteredQuantity * conversionFactor;
          quantityInPrimaryUnit = enteredQuantity;
        } else if (unitLower === baseUnitLower) {
          baseUnitQuantity = enteredQuantity;
          quantityInPrimaryUnit = enteredQuantity / conversionFactor;
        } else {
          throw {
            status: 400,
            message: `Invalid unit '${item.measurement.unit}' for ${menuItem.name}. Expected ${measurementDoc.unit} or ${measurementDoc.baseUnit}`
          };
        }

        const minValue = config.minValue as number | null | undefined;
        const maxValue = config.maxValue as number | null | undefined;
        const epsilon = 1e-6;

        if (typeof minValue === 'number' && quantityInPrimaryUnit < minValue - epsilon) {
          throw {
            status: 400,
            message: `Measurement for ${menuItem.name} must be at least ${minValue} ${measurementDoc.unit}`
          };
        }

        if (typeof maxValue === 'number' && quantityInPrimaryUnit > maxValue + epsilon) {
          throw {
            status: 400,
            message: `Measurement for ${menuItem.name} must be at most ${maxValue} ${measurementDoc.unit}`
          };
        }
      }

      const priceForOneUnit = (baseUnitQuantity / baseValue) * basePrice;

      if (item.measurement.totalPrice !== undefined) {
        const diff = Math.abs(item.measurement.totalPrice - priceForOneUnit);
        if (diff > 1.0) {
          throw {
            status: 400,
            message: `Price mismatch for ${menuItem.name}. Calculated: ${priceForOneUnit}, Provided: ${item.measurement.totalPrice}`
          };
        }
      }

      finalQuantity = 1;
      itemTotal = priceForOneUnit;

      const unitName = item.measurement.unit;
      const baseUnitName = measurementDoc?.baseUnit || config.baseUnit || unitName;

      measurementSnapshot = {
        measurementId: String(config.measurementId || item.measurement.measurementId),
        unit: unitName,
        enteredQuantity: enteredQuantity,
        baseUnit: baseUnitName,
        baseUnitQuantity: baseUnitQuantity, // Correctly calculated for inventory
        baseValue: baseValue,
        basePrice: basePrice,
        totalPrice: priceForOneUnit
      };
    } else {
      // Quantity Based
      if (!item.quantity) {
        throw { status: 400, message: `Quantity required for ${menuItem.name}` };
      }
      basePrice = variant?.basePrice ?? menuItem.basePrice ?? 0;
      itemTotal = basePrice * item.quantity;
      finalQuantity = item.quantity;
    }

    const baseLineAmount = itemTotal;
    const currentItemId = new Types.ObjectId();

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
        const totalAddonPrice = addonPrice * addonDto.quantity * finalQuantity;
        // Addon price is multiplied by item quantity (even for measurement items, usually 1)
        addonTotal += totalAddonPrice;
        itemTotal += totalAddonPrice;

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
      quantity: finalQuantity,
      taxGroupId: null,
      baseLineAmount,
      addonTotal,
      discountAmount: 0,
      taxableAmount: itemTotal,
      taxAmount: 0,
      grossLineAmount: itemTotal,
      netLineAmount: itemTotal,
      appliedTaxes: [],
      measurement: measurementSnapshot,
      variationId: item.variationId ? new Types.ObjectId(item.variationId) : null,
      variationName,
      instruction: item.instruction,
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

const buildTaxAwareOrderPreview = async (
  brandId: string,
  outletId: string,
  orderType: ORDER_TYPE,
  requestedItems: AddItemToOrderDTO[],
  processedItems: ProcessedOrderItem[],
  menuItemMap: Map<string, any>
) => {
  const resolvedTaxesMap = await resolveEffectiveTaxesForMenuItems(
    brandId,
    outletId,
    requestedItems.map(item => {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw { status: 404, message: `MenuItem ${item.menuItemId} not found` };
      }

      return {
        _id: menuItem._id,
        categoryId: menuItem.categoryId,
        taxGroupId: menuItem.taxGroupId ?? null
      };
    })
  );

  const previewItems = processedItems.map(processedItem => {
    const resolvedTaxes = resolvedTaxesMap.get(String(processedItem.menuItemId)) ?? {
      taxGroupId: null,
      taxes: []
    };

    const calculatedLine = calculateLineTax({
      orderType,
      quantity: processedItem.quantity,
      baseAmount: processedItem.baseLineAmount ?? processedItem.totalPrice,
      addonAmount: processedItem.addonTotal ?? 0,
      discountAmount: processedItem.discountAmount ?? 0,
      taxes: resolvedTaxes.taxes
    });

    return {
      menuItemId: String(processedItem.menuItemId),
      itemName: processedItem.itemName,
      quantity: processedItem.quantity,
      taxGroupId: resolvedTaxes.taxGroupId ? String(resolvedTaxes.taxGroupId) : null,
      baseLineAmount: calculatedLine.baseLineAmount,
      addonTotal: calculatedLine.addonTotal,
      discountAmount: calculatedLine.discountAmount,
      taxableAmount: calculatedLine.taxableAmount,
      taxAmount: calculatedLine.taxAmount,
      grossLineAmount: calculatedLine.grossLineAmount,
      netLineAmount: calculatedLine.netLineAmount,
      appliedTaxes: calculatedLine.appliedTaxes
    };
  });

  const summary = summarizeOrderTaxes({
    lines: previewItems.map(item => ({
      quantity: item.quantity,
      baseLineAmount: item.baseLineAmount,
      addonTotal: item.addonTotal,
      grossLineAmount: item.grossLineAmount,
      discountAmount: item.discountAmount,
      taxableAmount: item.taxableAmount,
      taxAmount: item.taxAmount,
      netLineAmount: item.netLineAmount,
      appliedTaxes: item.appliedTaxes
    }))
  });

  return {
    ...summary,
    items: previewItems
  };
};

const mapPreviewItemToStoredOrderItem = (
  orderId: Types.ObjectId,
  processedItem: ProcessedOrderItem,
  previewItem: Awaited<ReturnType<typeof buildTaxAwareOrderPreview>>['items'][number],
  now: Date
) => ({
  ...processedItem,
  orderId,
  taxGroupId: previewItem?.taxGroupId ? new Types.ObjectId(previewItem.taxGroupId) : null,
  baseLineAmount: previewItem?.baseLineAmount ?? processedItem.baseLineAmount ?? processedItem.totalPrice,
  addonTotal: previewItem?.addonTotal ?? processedItem.addonTotal ?? 0,
  discountAmount: previewItem?.discountAmount ?? 0,
  taxableAmount: previewItem?.taxableAmount ?? processedItem.totalPrice,
  taxAmount: previewItem?.taxAmount ?? 0,
  grossLineAmount: previewItem?.grossLineAmount ?? processedItem.totalPrice,
  netLineAmount: previewItem?.netLineAmount ?? processedItem.totalPrice,
  appliedTaxes:
    previewItem?.appliedTaxes?.map(tax => ({
      ...tax,
      taxId: tax.taxId ? new Types.ObjectId(String(tax.taxId)) : null
    })) ?? [],
  kotSentAt: now
});

const recalculateStoredLinePricing = (orderItem: any, quantity: number, orderType: ORDER_TYPE) => {
  const safeOldQuantity = Math.max(orderItem.quantity || 1, 1);
  const basePerUnit =
    orderItem.baseLineAmount !== undefined
      ? (orderItem.baseLineAmount || 0) / safeOldQuantity
      : orderItem.basePrice || 0;
  const addonPerUnit = (orderItem.addonTotal || 0) / safeOldQuantity;

  const taxes = (orderItem.appliedTaxes || []).map((tax: any) => ({
    taxId: tax.taxId ? String(tax.taxId) : null,
    name: tax.name,
    rate: tax.rate,
    type: tax.type,
    isInclusive: tax.isInclusive,
    calculationMethod: tax.calculationMethod,
    applicableOrderTypes: undefined
  }));

  const calculatedLine = calculateLineTax({
    orderType,
    quantity,
    baseAmount: basePerUnit,
    addonAmount: addonPerUnit * quantity,
    discountAmount: 0,
    taxes
  });

  return {
    quantity,
    totalPrice: calculatedLine.grossLineAmount,
    baseLineAmount: calculatedLine.baseLineAmount,
    addonTotal: calculatedLine.addonTotal,
    discountAmount: calculatedLine.discountAmount,
    taxableAmount: calculatedLine.taxableAmount,
    taxAmount: calculatedLine.taxAmount,
    grossLineAmount: calculatedLine.grossLineAmount,
    netLineAmount: calculatedLine.netLineAmount,
    appliedTaxes: calculatedLine.appliedTaxes.map(tax => ({
      ...tax,
      taxId: tax.taxId ? new Types.ObjectId(String(tax.taxId)) : null
    }))
  };
};

const recalculatePersistedOrderTotals = async (
  orderId: Types.ObjectId,
  session?: mongoose.ClientSession
) => {
  const itemQuery = OrderItemEntity.find({
    orderId,
    isDelete: false,
    itemStatus: { $ne: ITEM_STATUS.CANCELLED }
  }).lean();

  if (session) {
    itemQuery.session(session);
  }

  const items = await itemQuery;

  const summary = summarizeOrderTaxes({
    lines: items.map(item => ({
      quantity: item.quantity,
      baseLineAmount: item.baseLineAmount ?? item.totalPrice ?? 0,
      addonTotal: item.addonTotal ?? 0,
      grossLineAmount: item.grossLineAmount ?? item.totalPrice ?? 0,
      discountAmount: item.discountAmount ?? 0,
      taxableAmount: item.taxableAmount ?? item.totalPrice ?? 0,
      taxAmount: item.taxAmount ?? 0,
      netLineAmount: item.netLineAmount ?? item.totalPrice ?? 0,
      appliedTaxes: item.appliedTaxes ?? []
    }))
  });

  const orderUpdateQuery = OrderEntity.updateOne(
    { _id: orderId },
    {
      $set: {
        grossAmount: summary.grossAmount,
        subtotal: summary.subtotal,
        taxableAmount: summary.taxableAmount,
        taxAmount: summary.taxAmount,
        roundOffAmount: summary.roundOffAmount,
        taxBreakup: summary.taxBreakup,
        discountAmount: 0,
        totalAmount: summary.totalAmount
      }
    }
  );

  if (session) {
    orderUpdateQuery.session(session);
  }

  await orderUpdateQuery;
  return summary;
};

export const previewOrderPricing = async (
  brandId: string,
  outletId: string,
  dto: PreviewOrderDTO
) => {
  if (!dto.items || dto.items.length === 0) {
    throw { status: 400, message: 'At least one item is required' };
  }

  const { menuItemMap, variantMap, variants, addonMap, measurementMap } = await batchFetchMenuData(
    dto.items
  );

  const { processedItems, subtotal } = processItems(
    dto.items,
    brandId,
    outletId,
    menuItemMap,
    variantMap,
    variants,
    addonMap,
    measurementMap
  );

  const pricing = await recalculateOrderPricing(
    brandId,
    outletId,
    dto.customerId ? new Types.ObjectId(dto.customerId) : null,
    subtotal
  );

  if (pricing.discountAmount > 0 && subtotal > 0) {
    for (const item of processedItems) {
      const itemRatio = item.totalPrice / subtotal;
      item.discountAmount = pricing.discountAmount * itemRatio;
    }
  }

  const pricingPreview = await buildTaxAwareOrderPreview(
    brandId,
    outletId,
    dto.orderType,
    dto.items,
    processedItems,
    menuItemMap
  );

  return {
    ...pricingPreview,
    discountAmount: pricing.discountAmount,
    discountType: pricing.discountType,
    discountValue: pricing.discountValue
  };
};

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
  const { menuItemMap, variantMap, variants, addonMap, measurementMap } = await batchFetchMenuData(
    dto.items
  );

  // Process items
  const { processedItems, processedAddons, subtotal } = processItems(
    dto.items,
    brandId,
    outletId,
    menuItemMap,
    variantMap,
    variants,
    addonMap,
    measurementMap
  );

  const pricing = await recalculateOrderPricing(
    brandId,
    outletId,
    dto.customerId ? new Types.ObjectId(dto.customerId) : null,
    subtotal
  );

  if (pricing.discountAmount > 0 && subtotal > 0) {
    for (const item of processedItems) {
      const itemRatio = item.totalPrice / subtotal;
      item.discountAmount = pricing.discountAmount * itemRatio;
    }
  }

  const pricingPreview = await buildTaxAwareOrderPreview(
    brandId,
    outletId,
    dto.orderType,
    dto.items,
    processedItems,
    menuItemMap
  );
  const totalAmount = pricingPreview.totalAmount;

  // Atomic IDs and sequences
  const orderId = new Types.ObjectId();
  const orderSeq = await getNextSequence(brandId, outletId, 'ORDER');
  const todayStr = getTodayStr().replace(/-/g, '');
  const orderNumber = `ORD-${todayStr}-${String(orderSeq).padStart(4, '0')}`;

  // Token number
  let tokenNo: string | undefined = undefined;
  let tableName: string | undefined = undefined;

  if (dto.orderType === ORDER_TYPE.TAKEAWAY || dto.orderType === ORDER_TYPE.DELIVERY) {
    const tokenSeq = await getNextSequence(brandId, outletId, 'TOKEN');
    tokenNo = String(tokenSeq);
  } else if (dto.orderType === ORDER_TYPE.DINE_IN && dto.tableId) {
    const table = await TableEntity.findById(dto.tableId).lean();
    if (!table) throw { status: 404, message: 'Table not found' };
    tableName = table.name;
    // For DINE_IN, tokenNo remains null as per requirements
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orderDoc = {
      _id: orderId,
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      waiterId: new Types.ObjectId(userId),
      customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : null,
      orderNumber,
      tokenNo,
      orderType: dto.orderType,
      tableId: dto.tableId ? new Types.ObjectId(dto.tableId) : null,
      status: ORDER_STATUS.OPEN,
      grossAmount: pricingPreview.grossAmount,
      subtotal: pricingPreview.subtotal,
      taxableAmount: pricingPreview.taxableAmount,
      taxAmount: pricingPreview.taxAmount,
      roundOffAmount: pricingPreview.roundOffAmount,
      taxBreakup: pricingPreview.taxBreakup.map(tax => ({
        ...tax,
        taxId: tax.taxId ? new Types.ObjectId(String(tax.taxId)) : null
      })),
      discountAmount: pricing.discountAmount,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      totalAmount,
      notes: dto.notes && dto.notes.trim().length > 0 ? dto.notes.trim() : undefined,
      isActive: true,
      isDelete: false
    };

    await OrderEntity.create([orderDoc], { session });

    const now = new Date();
    const finalItems = processedItems.map((pi, index) => ({
      ...pi,
      orderId,
      taxGroupId: pricingPreview.items[index]?.taxGroupId
        ? new Types.ObjectId(pricingPreview.items[index].taxGroupId)
        : null,
      baseLineAmount:
        pricingPreview.items[index]?.baseLineAmount ?? pi.baseLineAmount ?? pi.totalPrice,
      addonTotal: pricingPreview.items[index]?.addonTotal ?? pi.addonTotal ?? 0,
      discountAmount: pricingPreview.items[index]?.discountAmount ?? 0,
      taxableAmount: pricingPreview.items[index]?.taxableAmount ?? pi.totalPrice,
      taxAmount: pricingPreview.items[index]?.taxAmount ?? 0,
      grossLineAmount: pricingPreview.items[index]?.grossLineAmount ?? pi.totalPrice,
      netLineAmount: pricingPreview.items[index]?.netLineAmount ?? pi.totalPrice,
      appliedTaxes:
        pricingPreview.items[index]?.appliedTaxes?.map(tax => ({
          ...tax,
          taxId: tax.taxId ? new Types.ObjectId(String(tax.taxId)) : null
        })) ?? [],
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

  const { menuItemMap, variantMap, variants, addonMap, measurementMap } = await batchFetchMenuData(
    dto.items
  );
  const {
    processedItems,
    processedAddons
  } = processItems(
    dto.items,
    brandId,
    outletId,
    menuItemMap,
    variantMap,
    variants,
    addonMap,
    measurementMap
  );
  const pricingPreview = await buildTaxAwareOrderPreview(
    brandId,
    outletId,
    order.orderType,
    dto.items,
    processedItems,
    menuItemMap
  );

  const now = new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const finalItems = processedItems.map((pi, index) =>
      mapPreviewItemToStoredOrderItem(order._id, pi, pricingPreview.items[index], now)
    );
    await OrderItemEntity.insertMany(finalItems, { session });

    if (processedAddons.length > 0) {
      await OrderItemAddonEntity.insertMany(
        processedAddons.map(pa => ({ ...pa, orderId: order._id })),
        { session }
      );
    }

    // Atomic total update — no read-modify-write race condition
    await recalculatePersistedOrderTotals(order._id, session);

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Generate supplemental KOT
  let tableName: string | undefined = undefined;
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
          cancelReason: dto.cancelReason || undefined,
          cancelledAt: now,
          cancelledBy: performedBy ? new Types.ObjectId(performedBy) : null
        }
      },
      { session }
    );

    await recalculatePersistedOrderTotals(order._id, session);

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

  let quantityDelta = 0;

  if (dto.quantity !== undefined && dto.quantity !== orderItem.quantity) {
    if (dto.quantity < 1) throw { status: 400, message: 'Quantity must be at least 1' };
    quantityDelta = dto.quantity - orderItem.quantity;
    const repricedLine = recalculateStoredLinePricing(orderItem, dto.quantity, order.orderType);
    updateFields.quantity = repricedLine.quantity;
    updateFields.totalPrice = repricedLine.totalPrice;
    updateFields.baseLineAmount = repricedLine.baseLineAmount;
    updateFields.addonTotal = repricedLine.addonTotal;
    updateFields.discountAmount = repricedLine.discountAmount;
    updateFields.taxableAmount = repricedLine.taxableAmount;
    updateFields.taxAmount = repricedLine.taxAmount;
    updateFields.grossLineAmount = repricedLine.grossLineAmount;
    updateFields.netLineAmount = repricedLine.netLineAmount;
    updateFields.appliedTaxes = repricedLine.appliedTaxes;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await OrderItemEntity.updateOne({ _id: orderItem._id }, { $set: updateFields }, { session });
    await recalculatePersistedOrderTotals(order._id, session);

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
    .populate('customerId', 'name mobile email tags loyaltyPoints totalSpent totalOrders lastVisitAt creditBalance isActive')
    .populate('cancelledBy', 'name')
    .lean();

  if (!order) return null;

  const [items, addons] = await Promise.all([
    OrderItemEntity.find({ orderId: order._id, isDelete: false }).lean(),
    OrderItemAddonEntity.find({ orderId: order._id, isDelete: false }).lean()
  ]);

  const formattedItems = items.map(item => ({
    ...item,
    instruction: item.instruction ?? null,
    addons: addons.filter(addon => String(addon.orderItemId) === String(item._id))
  }));

  const result: any = {
    ...order,
    notes: (order as any).notes ?? null,
    items: formattedItems
  };

  // Requirement: Do NOT include tokenNumber in the API response for DINE_IN
  if (order.orderType === ORDER_TYPE.DINE_IN) {
    delete result.tokenNo;
  }

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────

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

  // Condition 1: Payment must be fully completed
  const currentPaidAmount = order.paidAmount ?? 0;
  // +0.001 for float tolerance
  if (currentPaidAmount < order.totalAmount - 0.001) {
    return false;
  }

  // Condition 2: All items must be fully processed
  const pendingItemsCount = await OrderItemEntity.countDocuments({
    orderId: order._id,
    itemStatus: { $nin: [ITEM_STATUS.SERVED, ITEM_STATUS.CANCELLED] },
    isDelete: false
  });

  if (pendingItemsCount > 0) {
    return false;
  }

  // Both conditions met, auto-close the order
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

  const userIdStr = performedBy ? String(performedBy) : null;
  logOrderAction({
    brandId,
    outletId,
    orderId: String(order._id),
    action: ORDER_AUDIT_ACTION.ORDER_CLOSED,
    performedBy: userIdStr,
    metadata: { reason: 'auto_closed' }
  });
  orderEvents.emit('order.closed', { orderId: String(order._id), brandId, outletId });

  return true;
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
      await TableEntity.findByIdAndUpdate(order.tableId, { status: TABLE_STATUS.CLEANING });
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
      .populate('customerId', 'name mobile email tags loyaltyPoints totalSpent totalOrders lastVisitAt creditBalance isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    OrderEntity.countDocuments(filter)
  ]);

  const normalizedItems = items.map(item => ({
    ...item,
    notes: (item as any).notes ?? null
  }));

  return { items: normalizedItems, total };
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

// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const removeUnwantedFields = <T>(obj: T): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(removeUnwantedFields);
  }

  if (obj instanceof Date || obj instanceof mongoose.Types.ObjectId) {
    return obj;
  }

  const clone = { ...obj } as Record<string, unknown>;
  delete clone.brandId;
  delete clone.outletId;
  delete clone.__v;

  for (const key of Object.keys(clone)) {
    if (clone[key] && typeof clone[key] === 'object') {
      clone[key] = removeUnwantedFields(clone[key]);
    }
  }

  return clone;
};

export const transformOrderToKOTFormat = (
  order: Order & { items?: any[] }
): KOTFriendlyResponse => {
  const cleanedOrder = removeUnwantedFields(order);
  const kotsMap = new Map<string, any[]>();

  const items = cleanedOrder.items || [];
  for (const item of items) {
    const timeKey = item.kotSentAt ? new Date(item.kotSentAt).toISOString() : 'UNSENT';

    if (!kotsMap.has(timeKey)) {
      kotsMap.set(timeKey, []);
    }

    kotsMap.get(timeKey)!.push(item);
  }

  const sortedKeys = Array.from(kotsMap.keys()).sort((a, b) => {
    if (a === 'UNSENT') return 1;
    if (b === 'UNSENT') return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const kots: KOTFriendlyBatch[] = sortedKeys.map((key, index) => {
    return {
      kotNumber: `KOT-${index + 1}`,
      createdAt: key === 'UNSENT' ? null : key,
      items: kotsMap.get(key)!
    };
  });

  delete cleanedOrder.items;
  cleanedOrder.kots = kots;

  return cleanedOrder;
};

export const getKOTOrderDetails = async (
  brandId: string,
  outletId: string,
  orderId: string
): Promise<KOTFriendlyResponse | null> => {
  const order = await getOrderById(brandId, outletId, orderId);
  if (!order) return null;

  return transformOrderToKOTFormat(order);
};


