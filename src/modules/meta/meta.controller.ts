import { getConstants } from '@modules/meta/meta.service';

import type { Request, Response, NextFunction } from 'express';

export const getConstantsController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = getConstants();
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

export default getConstantsController;
