import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
    this.logger.log('Cloudinary configured');
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
    this.logger.log(`Uploading file: ${file?.originalname}, size: ${file?.size}, mimetype: ${file?.mimetype}`);

    if (!file || !file.buffer) {
      this.logger.error('No file or file buffer received by uploadImage()');
      throw new Error('No file buffer received — check FileInterceptor storage config');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`, error);
            return reject(error);
          }
          this.logger.log(`Cloudinary upload success: ${result?.secure_url}`);
          resolve(result as UploadApiResponse);
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}