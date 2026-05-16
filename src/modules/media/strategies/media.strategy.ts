import { v7 as uuidv7 } from 'uuid';
import sharp from 'sharp';
import type { Express } from 'express';

export interface IMediaStrategy {
  validate(file: Express.Multer.File): void;
  process(file: Express.Multer.File): Promise<Express.Multer.File>;
  generateKey(filename: string, brandId?: string, outletId?: string, entityId?: string): string;
}

export class BaseMediaStrategy implements IMediaStrategy {
  protected moduleName: string;
  protected environment: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
    this.environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  }

  public validate(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }
  }

  public async process(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (!file.mimetype.startsWith('image/')) {
      return file; // Return as is for PDFs etc.
    }

    if (file.mimetype === 'image/svg+xml') {
      return file; // SVGs shouldn't be processed by sharp generally to preserve vectors
    }

    // Visually lossless processing: strip metadata, retain format if high quality, convert to webp otherwise
    const processedBuffer = await sharp(file.buffer)
      .toBuffer();

    return {
      ...file,
      buffer: processedBuffer,
      size: processedBuffer.length
    };
  }

  public generateKey(filename: string, brandId?: string, outletId?: string, entityId?: string): string {
    const ext = filename.split('.').pop() || '';
    const uniqueId = uuidv7();
    
    const brandPart = brandId ? `brands/${brandId}` : 'brands/global';
    const outletPart = outletId ? `outlets/${outletId}` : 'outlets/global';
    const entityPart = entityId ? `/${entityId}` : '';

    return `${this.environment}/${brandPart}/${outletPart}/modules/${this.moduleName}${entityPart}/${uniqueId}.${ext}`;
  }
}

export class MediaStrategyFactory {
  public static getStrategy(moduleName: string): IMediaStrategy {
    // In future phases, switch case can return ProductMediaStrategy, AvatarMediaStrategy, etc.
    switch (moduleName) {
      default:
        return new BaseMediaStrategy(moduleName);
    }
  }
}
