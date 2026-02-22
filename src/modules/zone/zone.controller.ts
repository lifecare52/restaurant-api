import { createZone, listZones, getZone, updateZone, deleteZone } from '@modules/zone/zone.service';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const createZoneController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const item = await createZone(brandId, outletId, req.body);
    res.locals.response = {
      status: true,
      code: 201,
      message: 'Zone created successfully',
      data: item,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const listZonesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listZones(brandId, outletId, req.query);
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getZoneController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { zoneId } = req.query as { zoneId: string };
    const item = await getZone(brandId, outletId, zoneId);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: item };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateZoneController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { zoneId } = req.query as { zoneId: string };
    const item = await updateZone(brandId, outletId, zoneId, req.body);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: 'Zone updated successfully',
        data: item,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteZoneController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { zoneId } = req.query as { zoneId: string };
    const item = await deleteZone(brandId, outletId, zoneId);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, message: 'Zone deleted successfully' };
    }
    next();
  } catch (err) {
    next(err);
  }
};
