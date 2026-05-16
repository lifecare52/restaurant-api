import Joi from 'joi';
import { 
  MediaVisibilityEnum, 
  MediaSourceTypeEnum, 
  MediaUploadedViaEnum 
} from '@shared/enum';

export const uploadMediaSchema = Joi.object({
  module: Joi.string().required(),
  visibility: Joi.string().valid(...Object.values(MediaVisibilityEnum)).optional(),
  sourceType: Joi.string().valid(...Object.values(MediaSourceTypeEnum)).optional(),
  uploadedVia: Joi.string().valid(...Object.values(MediaUploadedViaEnum)).optional()
});
