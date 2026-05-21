import Joi from 'joi';

import type {
  OutletScopedPayload,
  PrintJobRequestPayload,
  RegisterPrinterServicePayload,
} from './printer-service.types';

type ValidationResult<T> = { success: true; value: T } | { success: false; errorMessage: string };

const outletId = Joi.string().trim().length(24).hex().required();
const systemDetail = Joi.string().trim().min(1).max(150);
const base64Image = Joi.string().trim().min(1);

export const printerServiceValidator = {
  register: Joi.object<RegisterPrinterServicePayload>({
    outletId,
    systemName: systemDetail.optional(),
    hostname: systemDetail.optional(),
    platform: systemDetail.optional(),
  }).unknown(true),
  outletScoped: Joi.object<OutletScopedPayload>({
    outletId,
  }).unknown(true),
  printJobRequest: Joi.object<PrintJobRequestPayload>({
    outletId,
    kotImages: Joi.array().items(base64Image).min(1).optional(),
    receiptImage: base64Image.optional(),
    printerName: Joi.string().trim().min(1).max(255).optional(),
    jobName: Joi.string().trim().min(1).max(150).optional(),
  })
    .or('kotImages', 'receiptImage')
    .unknown(true),
};

export const validateSocketPayload = <T>(
  schema: Joi.ObjectSchema<T>,
  payload: unknown,
): ValidationResult<T> => {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { success: false, errorMessage: error.details.map(detail => detail.message).join(', ') };
  }

  return { success: true, value: value as T };
};
