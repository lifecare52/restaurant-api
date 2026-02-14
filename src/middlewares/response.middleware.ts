import type { IApiResponse } from '@shared/interfaces/api';

import type { Request, Response, NextFunction } from 'express';

export const responseMiddleware = (_req: Request, res: Response, _next: NextFunction): void => {
  const r = res.locals.response as IApiResponse;
  const code = r?.code;
  const payload: IApiResponse = {
    status: r?.status ?? true,
    code,
    message: r?.message,
    data: r?.data,
    errors: r?.errors,
    validationMessages: r?.validationMessages,
    total: r?.total,
  };
  res.status(code).json(payload);
};

export default responseMiddleware;
