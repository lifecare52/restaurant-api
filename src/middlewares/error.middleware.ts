import type { IApiResponse, IApiError } from '@shared/interfaces/api';

import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const e = err as {
    status?: number;
    message?: string;
    code?: string;
    validationMessages?: string[];
  };
  const status = e?.status ?? 500;
  const message = e?.message ?? 'Internal Server Error';
  const apiError: IApiError | undefined = e?.code ? { code: e.code, message } : undefined;
  const response: IApiResponse = {
    status: false,
    code: status,
    message,
    errors: apiError ? [apiError] : undefined,
    validationMessages: e?.validationMessages
  };
  res.locals.response = response;
  _next();
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next({ status: 404, code: 'NOT_FOUND', message: 'Not Found' });
};

export default errorHandler;
