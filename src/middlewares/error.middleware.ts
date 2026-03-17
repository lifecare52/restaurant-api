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
    code?: string | number;
    validationMessages?: string[];
    keyValue?: Record<string, any>;
  };

  let status = e?.status ?? 500;
  let message = e?.message ?? 'Internal Server Error';

  // Handle MongoDB Duplicate Key Error (Code 11000)
  if (e?.code === 11000) {
    status = 409;
    if (e.keyValue) {
      const keys = Object.keys(e.keyValue).join(', ');
      message = `${keys.charAt(0).toUpperCase() + keys.slice(1)} already exists.`;
    } else {
      message = 'A record with this information already exists.';
    }
  }

  const apiError: IApiError | undefined = e?.code ? { code: String(e.code), message } : undefined;
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
