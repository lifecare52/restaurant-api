import { getPosMenuCategoryWise } from './order-menu-item.service';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

/**
 * GET /api/v1/order/menu-items
 * Returns the full POS menu grouped by category with all variations, addons, and configs.
 */
export const getPosMenuController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const data = await getPosMenuCategoryWise(brandId, outletId);

    res.locals.response = {
      status: true,
      code: 200,
      data
    };
    next();
  } catch (err) {
    next(err);
  }
};

export default { getPosMenuController };
