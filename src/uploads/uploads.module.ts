import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}