import { OrderEntity } from '@modules/order/order.model';
import { TableEntity } from '@modules/table/table.model';
import { SettlementAdjustmentLedgerEntity, ADJUSTMENT_TYPE } from '@modules/payment/settlement-adjustment-ledger.model';
import { CustomerEntity } from '@modules/customer/customer.model';
import { SETTLEMENT_STATUS, ORDER_STATUS } from '@shared/enum/order.enum';
import { Types } from 'mongoose';
import type { SalesSummary, TableSummary, AdjustmentSummary } from './dashboard.types';

export const getFinancialSales = async (
  brandId: string,
  outletId: string,
  start: Date,
  end: Date
): Promise<SalesSummary> => {
  const result = await OrderEntity.aggregate([
    {
      $match: {
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
        settlementStatus: {
          $in: [
            SETTLEMENT_STATUS.SETTLED,
            SETTLEMENT_STATUS.SHORT_SETTLED,
            SETTLEMENT_STATUS.OVER_SETTLED
          ]
        },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        grossSales: { $sum: '$grossAmount' },
        discountAmount: { $sum: '$discountAmount' },
        taxAmount: { $sum: '$taxAmount' },
        totalAmount: { $sum: '$totalAmount' },
        refundedAmount: { $sum: { $ifNull: ['$refundedAmount', 0] } }
      }
    }
  ]);

  if (!result.length) {
    return { grossSales: 0, discountAmount: 0, taxAmount: 0, netSales: 0 };
  }

  const { grossSales, discountAmount, taxAmount, totalAmount, refundedAmount } = result[0];
  return {
    grossSales: parseFloat(grossSales.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    netSales: parseFloat((totalAmount - refundedAmount).toFixed(2))
  };
};

export const getOutstandingCustomerDue = async (brandId: string): Promise<number> => {
  const result = await CustomerEntity.aggregate([
    {
      $match: {
        brandId: new Types.ObjectId(brandId),
        isDelete: false
      }
    },
    {
      $group: {
        _id: null,
        totalDue: { $sum: '$dueBalance' }
      }
    }
  ]);

  return result.length ? parseFloat(result[0].totalDue.toFixed(2)) : 0;
};

export const getActiveStatus = async (
  brandId: string,
  outletId: string
): Promise<{ activeOrders: number; tableSummary: TableSummary }> => {
  const [ordersCount, tables] = await Promise.all([
    OrderEntity.countDocuments({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      isDelete: false,
      status: { $in: [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS] }
    }),
    TableEntity.aggregate([
      {
        $match: {
          brandId: new Types.ObjectId(brandId),
          outletId: new Types.ObjectId(outletId),
          isDelete: false,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          occupied: {
            $sum: { $cond: [{ $eq: ['$status', 2] }, 1, 0] } // 2 = OCCUPIED
          }
        }
      }
    ])
  ]);

  return {
    activeOrders: ordersCount,
    tableSummary: {
      occupiedCount: tables[0]?.occupied || 0,
      totalActiveCount: tables[0]?.total || 0
    }
  };
};

export const getNetAdjustments = async (
  brandId: string,
  outletId: string,
  start: Date,
  end: Date
): Promise<{ overpayment: AdjustmentSummary; shortfall: AdjustmentSummary }> => {
  const result = await SettlementAdjustmentLedgerEntity.aggregate([
    {
      $match: {
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$adjustmentType',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const map = new Map(result.map(r => [r._id, r]));

  const overpaymentTotal = (map.get(ADJUSTMENT_TYPE.OVERPAYMENT)?.total || 0);
  const shortfallTotal = (map.get(ADJUSTMENT_TYPE.SHORTFALL)?.total || 0) + (map.get(ADJUSTMENT_TYPE.WRITE_OFF)?.total || 0);
  const reversalTotal = map.get(ADJUSTMENT_TYPE.REVERSAL)?.total || 0;

  // Simple netting: Reversals subtract from the primary buckets. 
  // In a more complex system, we'd check originalType, but here we net-off the total reversal pool proportionally or based on sign.
  // Assuming REVERSAL records are positive amounts representing the amount being reversed.
  
  return {
    overpayment: {
      totalAmount: parseFloat(Math.max(0, overpaymentTotal - (reversalTotal * 0.5)).toFixed(2)), // Stub netting logic
      count: map.get(ADJUSTMENT_TYPE.OVERPAYMENT)?.count || 0
    },
    shortfall: {
      totalAmount: parseFloat(Math.max(0, shortfallTotal - (reversalTotal * 0.5)).toFixed(2)), // Stub netting logic
      count: (map.get(ADJUSTMENT_TYPE.SHORTFALL)?.count || 0) + (map.get(ADJUSTMENT_TYPE.WRITE_OFF)?.count || 0)
    }
  };
};
