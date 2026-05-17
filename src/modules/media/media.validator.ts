import Joi from 'joi';

import { MediaModuleEnum } from '@shared/enum';

export const uploadMediaSchema = Joi.object({
  module: Joi.string()
    .valid(...Object.values(MediaModuleEnum))
    .required(),
});
