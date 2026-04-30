import type { Request, Response, NextFunction } from 'express';
import { getFinancialSales, getOutstandingCustomerDue, getActiveStatus, getNetAdjustments } from './dashboard.service';
import { TREND } from '@shared/enum/dashboard.enum';
import type { DashboardQueryDTO, SalesSummary, DashboardSummaryResponse } from './dashboard.types';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string) || '',
  outletId: (req.headers['outlet-id'] as string) || ''
});

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

const getTrend = (growth: number): TREND => {
  if (growth > 0) return TREND.UP;
  if (growth < 0) return TREND.DOWN;
  return TREND.STABLE;
};

export const getDashboardSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const query = req.query as DashboardQueryDTO;

    // 1. Determine primary date range
    let start: Date;
    let end: Date;

    if (query.startDateTime && query.endDateTime) {
      start = new Date(query.startDateTime);
      end = new Date(query.endDateTime);
    } else if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: Today
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    // 2. Periodic boundaries (WTD/MTD)
    const now = new Date();
    
    // WTD
    const wtdStart = new Date(now);
    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    wtdStart.setDate(diff);
    wtdStart.setHours(0, 0, 0, 0);
    
    const pwtdStart = new Date(wtdStart);
    pwtdStart.setDate(pwtdStart.getDate() - 7);
    const pwtdEnd = new Date(now);
    pwtdEnd.setDate(pwtdEnd.getDate() - 7);

    // MTD
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const pmtdStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const pmtdEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

    // 3. Orchestrate Queries
    const [
      salesSummary,
      activeStatus,
      adjustments,
      outstandingDue,
      wtdSales,
      pwtdSales,
      mtdSales,
      pmtdSales
    ] = await Promise.all([
      getFinancialSales(brandId, outletId, start, end),
      getActiveStatus(brandId, outletId),
      getNetAdjustments(brandId, outletId, start, end),
      getOutstandingCustomerDue(brandId),
      getFinancialSales(brandId, outletId, wtdStart, now),
      getFinancialSales(brandId, outletId, pwtdStart, pwtdEnd),
      getFinancialSales(brandId, outletId, mtdStart, now),
      getFinancialSales(brandId, outletId, pmtdStart, pmtdEnd)
    ]);

    const weeklyGrowth = calculateGrowth(wtdSales.netSales, pwtdSales.netSales);
    const monthlyGrowth = calculateGrowth(mtdSales.netSales, pmtdSales.netSales);

    const response: DashboardSummaryResponse = {
      salesSummary,
      weeklySummary: {
        current: wtdSales,
        previous: pwtdSales,
        growth: weeklyGrowth,
        trend: getTrend(weeklyGrowth)
      },
      monthlySummary: {
        current: mtdSales,
        previous: pmtdSales,
        growth: monthlyGrowth,
        trend: getTrend(monthlyGrowth)
      },
      activeOrdersCount: activeStatus.activeOrders,
      activeTablesSummary: activeStatus.tableSummary,
      overpaymentSummary: adjustments.overpayment,
      underpaymentSummary: adjustments.shortfall,
      outstandingCustomerDue: outstandingDue,
      lowStockCount: {
        value: 0,
        isStub: true
      }
    };

    res.locals.response = {
      status: true,
      code: 200,
      data: response
    };
    next();
  } catch (err) {
    next(err);
  }
};
