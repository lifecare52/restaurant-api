import { MediaModuleEnum } from '@shared/enum';

export interface UploadMediaDTO {
  module: MediaModuleEnum;
  brandId?: string;
  outletId?: string;
  uploadedBy?: string;
}
