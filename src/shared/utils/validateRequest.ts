import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type Joi from 'joi';

export const validateRequest =
  (
    schema: Joi.ObjectSchema,
    property: 'body' | 'query' | 'params' | 'headers' = 'body',
  ): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const options =
      property === 'headers'
        ? { abortEarly: false, allowUnknown: true, stripUnknown: false }
        : { abortEarly: false, allowUnknown: false, stripUnknown: true };
    const source =
      property === 'body'
        ? req.body
        : property === 'query'
          ? req.query
          : property === 'params'
            ? req.params
            : req.headers;
    const { error, value } = schema.validate(source, options);
    if (error) {
      const messages = error.details.map(d => d.message);
      return next({
        status: 422,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        validationMessages: messages,
      });
    }
    if (property === 'body') req.body = value as unknown as typeof req.body;
    else if (property === 'query') req.query = value as unknown as typeof req.query;
    else if (property === 'params') req.params = value as unknown as typeof req.params;
    else Object.assign(req.headers, value as Record<string, unknown>);
    next();
  };

export default validateRequest;
