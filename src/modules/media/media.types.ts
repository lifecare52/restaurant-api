import type { Types } from 'mongoose';
import {
  MediaVisibilityEnum,
  MediaStatusEnum,
  MediaSourceTypeEnum,
  MediaUploadedViaEnum,
  StorageProviderEnum
} from '@shared/enum';

export interface MediaVariants {
  original?: string;
  thumbnail?: string;
  medium?: string;
  large?: string;
}

export interface Media {
  key: string;
  module: string;
  entityId?: Types.ObjectId;
  outletId?: Types.ObjectId;

  originalFormat?: string;
  storedFormat?: string;
  size: number;
  checksum?: string;

  storageProvider: StorageProviderEnum;
  visibility: MediaVisibilityEnum;
  status: MediaStatusEnum;
  variants?: MediaVariants;

  usageCount: number;
  sourceType: MediaSourceTypeEnum;
  uploadedVia: MediaUploadedViaEnum;
  uploadedBy?: Types.ObjectId;
  uploadedAt: Date;

  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

export interface UploadMediaDTO {
  module: string;
  entityId?: string;
  outletId?: string;
  sourceType?: MediaSourceTypeEnum;
  uploadedVia?: MediaUploadedViaEnum;
  visibility?: MediaVisibilityEnum;
  uploadedBy?: string;
}
