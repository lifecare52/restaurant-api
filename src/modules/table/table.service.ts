import { Types } from 'mongoose';

import TableEntity from '@modules/table/table.model';
import type {
  TableCreateDTO,
  TableUpdateDTO,
  TableListQuery,
  TABLE_STATUS,
  Table,
} from '@modules/table/table.types';
import type { FilterQuery, UpdateQuery } from 'mongoose';
import type { Order, OrderItem } from '@modules/order/order.types';

export const createTable = async (brandId: string, outletId: string, dto: TableCreateDTO) => {
  try {
    const created = await TableEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      zoneId: dto.zoneId ? new Types.ObjectId(dto.zoneId) : undefined,
      name: dto.name,
      capacity: dto.capacity ?? 4,
      status: dto.status ?? 'AVAILABLE',
      isActive: dto.isActive ?? true,
      isDelete: false,
    });
    return created.toObject();
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_TABLE', message: 'Table name already exists' };
    }
    throw err;
  }
};

export const listTables = async (brandId: string, outletId: string, query: TableListQuery) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;
  const skip = (page - 1) * limit;

  const filter: FilterQuery<Table> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  };

  if (query.searchText) {
    filter.name = { $regex: new RegExp(query.searchText, 'i') };
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.zoneId) {
    filter.zoneId = new Types.ObjectId(query.zoneId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  const sortColumn = query.column || 'createdAt';
  const sortOrder = query.order === 'ASC' ? 1 : -1;

  const [items, total] = await Promise.all([
    TableEntity.find(filter)
      .populate('zoneId', 'name')
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    TableEntity.countDocuments(filter),
  ]);

  return { items, total };
};

export const getTable = async (brandId: string, outletId: string, tableId: string) => {
  return TableEntity.findOne({
    _id: new Types.ObjectId(tableId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  })
    .populate('zoneId', 'name')
    .lean();
};

export const updateTable = async (
  brandId: string,
  outletId: string,
  tableId: string,
  dto: TableUpdateDTO,
) => {
  try {
    const updateData: UpdateQuery<Table> = { ...dto };
    if (dto.zoneId !== undefined) {
      updateData.zoneId = dto.zoneId ? new Types.ObjectId(dto.zoneId) : null;
    }

    const updated = await TableEntity.findOneAndUpdate(
      {
        _id: new Types.ObjectId(tableId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
      },
      { $set: updateData },
      { new: true },
    ).populate('zoneId', 'name');

    return updated;
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_TABLE', message: 'Table name already exists' };
    }
    throw err;
  }
};

export const updateTableStatus = async (
  brandId: string,
  outletId: string,
  tableId: string,
  status: TABLE_STATUS,
) => {
  return TableEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(tableId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      isDelete: false,
    },
    { $set: { status } },
    { new: true },
  ).populate('zoneId', 'name');
};

export const deleteTable = async (brandId: string, outletId: string, tableId: string) => {
  return TableEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(tableId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      isDelete: false,
    },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export const getTableLiveOrders = async (brandId: string, outletId: string, tableId: string) => {
  // Needs to be imported dynamically or we just use mongoose model lookup
  // But we can just use mongoose connection or import OrderEntity
  const { OrderEntity, OrderItemEntity } = require('@modules/order/order.model');

  const orders = await OrderEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    tableId: new Types.ObjectId(tableId),
    status: { $in: ['OPEN', 'IN_PROGRESS'] }, // ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS
    isDelete: false,
  }).lean();

  if (!orders.length) return [];

  const orderIds = orders.map((o: Order) => o._id);

  const items = await OrderItemEntity.find({
    orderId: { $in: orderIds },
    isDelete: false,
  }).lean();

  return orders.map((order: Order) => ({
    ...order,
    items: items.filter((item: OrderItem) => String(item.orderId) === String(order._id)),
  }));
};

