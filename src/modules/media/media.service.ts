import type { Express } from 'express';
import { MediaEntity } from './media.model';
import { uploadToS3 } from '@shared/utils/s3.util';
import { MediaStrategyFactory } from './strategies/media.strategy';
import { MediaUrlService } from './services/media-url.service';
import type { UploadMediaDTO } from './media.types';
import { StorageProviderEnum, MediaStatusEnum } from '@shared/enum';

export class MediaService {
  public async uploadMedia(file: Express.Multer.File, dto: UploadMediaDTO) {
    const strategy = MediaStrategyFactory.getStrategy(dto.module);
    
    // 1. Validate based on strategy
    strategy.validate(file);

    // 2. Process based on strategy (sharp)
    const processedFile = await strategy.process(file);

    // 3. Generate key
    const key = strategy.generateKey(file.originalname, undefined, dto.outletId, dto.entityId);

    try {
      // 4. Upload to S3
      await uploadToS3(processedFile.buffer, key, processedFile.mimetype);
  
      // 5. Save to Media Registry
      const media = await MediaEntity.create({
        key,
        module: dto.module,
        entityId: dto.entityId || null,
        outletId: dto.outletId || null,
        originalFormat: file.mimetype,
        storedFormat: processedFile.mimetype,
        size: processedFile.size,
        storageProvider: StorageProviderEnum.S3,
        visibility: dto.visibility || 'PUBLIC',
        status: MediaStatusEnum.ACTIVE,
        usageCount: 1, 
        sourceType: dto.sourceType || 'SYSTEM',
        uploadedVia: dto.uploadedVia || 'API',
        uploadedBy: dto.uploadedBy || null
      });
  
      const publicUrl = MediaUrlService.getPublicUrl(key);
  
      return {
        mediaId: media._id,
        key,
        url: publicUrl,
        size: media.size,
        format: media.storedFormat
      };
    } catch (error) {
      console.error('Upload failed, rolling back if needed:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService();
