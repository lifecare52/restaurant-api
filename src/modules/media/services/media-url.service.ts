import { getS3SignedUrl } from '@shared/utils/s3.util';

export class MediaUrlService {
  /**
   * Generates a public URL (CDN or direct S3).
   */
  public static getPublicUrl(key: string): string {
    const cdnBase = process.env.CDN_BASE_URL;
    if (cdnBase) {
      return `${cdnBase.replace(/\/$/, '')}/${key}`;
    }

    // Fallback to S3 direct URL
    const bucket = process.env.AWS_S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-south-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Generates a pre-signed URL for private assets.
   */
  public static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getS3SignedUrl(key, expiresIn);
  }
}
