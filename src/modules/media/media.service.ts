import { uploadToS3 } from '@shared/utils/s3.util';

import { MediaUrlService } from './services/media-url.service';
import { MediaStrategyFactory } from './strategies/media.strategy';

import type { UploadMediaDTO } from './media.types';
import type { Express } from 'express';

export class MediaService {
  public async uploadMedia(file: Express.Multer.File, dto: UploadMediaDTO) {
    const strategy = MediaStrategyFactory.getStrategy(dto.module);

    // 1. Validate based on strategy
    strategy.validate(file);

    // 2. Process based on strategy (sharp)
    const processedFile = await strategy.process(file);

    // 3. Generate key
    const key = strategy.generateKey(file.originalname, dto.brandId, dto.outletId);

    try {
      // 4. Upload to S3
      await uploadToS3(processedFile.buffer, key, processedFile.mimetype);

      const publicUrl = MediaUrlService.getPublicUrl(key);

      return {
        key,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService();
