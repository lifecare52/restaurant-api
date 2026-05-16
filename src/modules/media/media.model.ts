import { Schema, model, type Model } from 'mongoose';
import type { Media } from '@modules/media/media.types';
import { 
  MediaVisibilityEnum, 
  MediaStatusEnum, 
  MediaSourceTypeEnum, 
  MediaUploadedViaEnum, 
  StorageProviderEnum 
} from '@shared/enum';

export type MediaModel = Model<Media>;

const MediaSchema = new Schema<Media>(
  {
    key: { type: String, required: true, unique: true },
    module: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    outletId: { type: Schema.Types.ObjectId, index: true },
    
    originalFormat: { type: String },
    storedFormat: { type: String },
    size: { type: Number, required: true },
    checksum: { type: String },
    
    storageProvider: { type: String, enum: Object.values(StorageProviderEnum), default: StorageProviderEnum.S3 },
    visibility: { type: String, enum: Object.values(MediaVisibilityEnum), default: MediaVisibilityEnum.PUBLIC },
    status: { type: String, enum: Object.values(MediaStatusEnum), default: MediaStatusEnum.UPLOADING },
    variants: {
      original: { type: String },
      thumbnail: { type: String },
      medium: { type: String },
      large: { type: String }
    },
    
    usageCount: { type: Number, default: 1 },
    sourceType: { type: String, enum: Object.values(MediaSourceTypeEnum), default: MediaSourceTypeEnum.SYSTEM },
    uploadedVia: { type: String, enum: Object.values(MediaUploadedViaEnum), default: MediaUploadedViaEnum.API },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

MediaSchema.index({ status: 1, usageCount: 1 });

export const MediaEntity = model<Media, MediaModel>('Media', MediaSchema, 'media');

export default MediaEntity;
