import Joi from 'joi';

export const objectId = Joi.string().length(24).hex();

export const commonHeaderSchema = Joi.object({
  'brand-id': objectId.required(),
  'outlet-id': objectId.required(),
}).unknown(true);
