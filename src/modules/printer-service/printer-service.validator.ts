import Joi from 'joi';

import type {
  GetPrinterServicePayload,
  RegisterPrinterServicePayload
} from './printer-service.types';

type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; errorMessage: string };

const outletId = Joi.string().trim().length(24).hex().required();
const systemDetail = Joi.string().trim().min(1).max(150);

export const printerServiceValidator = {
  register: Joi.object<RegisterPrinterServicePayload>({
    outletId,
    systemName: systemDetail.optional(),
    hostname: systemDetail.optional(),
    platform: systemDetail.optional()
  }).unknown(true),

  get: Joi.object<GetPrinterServicePayload>({
    outletId
  }).unknown(false)
};

export const validateSocketPayload = <T>(schema: Joi.ObjectSchema<T>, payload: unknown): ValidationResult<T> => {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return { success: false, errorMessage: error.details.map(detail => detail.message).join(', ') };
  }

  return { success: true, value: value as T };
};
