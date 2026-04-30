import { TREND } from '@shared/enum/dashboard.enum';
import type { Types } from 'mongoose';

export interface SalesSummary {
  grossSales: number;
  discountAmount: number;
  taxAmount: number;
  netSales: number;
}

export interface TableSummary {
  occupiedCount: number;
  totalActiveCount: number;
}

export interface AdjustmentSummary {
  totalAmount: number;
  count: number;
}

export interface DashboardSummaryResponse {
  salesSummary: SalesSummary;
  weeklySummary: {
    current: SalesSummary;
    previous: SalesSummary;
    growth: number;
    trend: TREND;
  };
  monthlySummary: {
    current: SalesSummary;
    previous: SalesSummary;
    growth: number;
    trend: TREND;
  };
  activeOrdersCount: number;
  activeTablesSummary: TableSummary;
  overpaymentSummary: AdjustmentSummary;
  underpaymentSummary: AdjustmentSummary;
  outstandingCustomerDue: number;
  lowStockCount: {
    value: number;
    isStub: boolean;
  };
}

export interface DashboardQueryDTO {
  startDate?: string;
  endDate?: string;
  startDateTime?: string;
  endDateTime?: string;
}
