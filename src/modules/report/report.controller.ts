import {
    getSalesReport,
    getItemSalesReport,
} from '@modules/report/report.service';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
    brandId: (req.headers['brand-id'] as string | undefined) || '',
    outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const getSalesReportController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { brandId, outletId } = getTenant(req);
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
        const items = await getSalesReport(brandId, outletId, startDate, endDate);
        res.locals.response = { status: true, code: 200, data: items };
        next();
    } catch (err) {
        next(err);
    }
};

export const getItemSalesReportController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { brandId, outletId } = getTenant(req);
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
        const items = await getItemSalesReport(brandId, outletId, startDate, endDate);
        res.locals.response = { status: true, code: 200, data: items };
        next();
    } catch (err) {
        next(err);
    }
};
