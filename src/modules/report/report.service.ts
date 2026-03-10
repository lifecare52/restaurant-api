import { Types, type FilterQuery } from 'mongoose';

import { OrderEntity, OrderItemEntity } from '@modules/order/order.model';
import { ORDER_STATUS, type Order, type OrderItem } from '@modules/order/order.types';

export const getSalesReport = async (
  brandId: string,
  outletId: string,
  startDate?: string,
  endDate?: string
) => {
  const match: FilterQuery<Order> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    status: ORDER_STATUS.COMPLETED,
    isDelete: false
  };

  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const result = await OrderEntity.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orderType: '$orderType'
        },
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        tax: { $sum: '$taxAmount' },
        discount: { $sum: '$discountAmount' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        orderType: '$_id.orderType',
        totalOrders: 1,
        totalAmount: 1,
        tax: 1,
        discount: 1
      }
    },
    { $sort: { date: -1 } }
  ]);

  return result;
};

export const getItemSalesReport = async (
  brandId: string,
  outletId: string,
  startDate?: string,
  endDate?: string
) => {
  const match: FilterQuery<OrderItem> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  };

  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const result = await OrderItemEntity.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          menuItemId: '$menuItemId',
          itemName: '$itemName',
          variationId: '$variationId',
          variationName: '$variationName'
        },
        quantitySold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalPrice' }
      }
    },
    {
      $project: {
        _id: 0,
        menuItemId: '$_id.menuItemId',
        itemName: '$_id.itemName',
        variationId: '$_id.variationId',
        variationName: '$_id.variationName',
        quantitySold: 1,
        totalRevenue: 1
      }
    },
    { $sort: { quantitySold: -1 } }
  ]);

  return result;
};
