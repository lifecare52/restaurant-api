import {
    generateKOT,
    listKOTsByOrder,
    listAllKOTs,
    updateKOTStatus,
    updateKOTItemStatus,
} from '@modules/kot/kot.service';
import { KOT_TYPE } from '@modules/kot/kot.types';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
    brandId: (req.headers['brand-id'] as string | undefined) || '',
    outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const listKOTsByOrderController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { brandId, outletId } = getTenant(req);
        const { orderId } = req.query as { orderId: string };
        const items = await listKOTsByOrder(brandId, outletId, orderId);
        res.locals.response = { status: true, code: 200, data: items };
        next();
    } catch (err) {
        next(err);
    }
};

/** Kitchen Display System — all active KOTs for this outlet */
export const listAllKOTsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { brandId, outletId } = getTenant(req);
        const { status } = req.query as { status?: string };
        const items = await listAllKOTs(brandId, outletId, status ? Number(status) : undefined);
        res.locals.response = { status: true, code: 200, data: items };
        next();
    } catch (err) {
        next(err);
    }
};

export const updateKOTStatusController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { brandId, outletId } = getTenant(req);
        const { kotId, status } = req.body;
        const item = await updateKOTStatus(brandId, outletId, kotId, Number(status));
        res.locals.response = { status: true, code: 200, message: 'KOT status updated', data: item };
        next();
    } catch (err) {
        next(err);
    }
};

/** Update individual item status within a KOT */
export const updateKOTItemStatusController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { brandId, outletId } = getTenant(req);
        const { kotItemId, status } = req.body;
        const item = await updateKOTItemStatus(brandId, outletId, kotItemId, Number(status));
        res.locals.response = { status: true, code: 200, message: 'KOT item status updated', data: item };
        next();
    } catch (err) {
        next(err);
    }
};
