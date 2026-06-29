import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { Testimonial, TestimonialSchema } from './schemas/testimonial.schema';
import { Faq, FaqSchema } from './schemas/faq.schema';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { CloudinaryModule } from '../../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: SettingSchema },
      { name: Testimonial.name, schema: TestimonialSchema },
      { name: Faq.name, schema: FaqSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [SettingsController, TestimonialsController, FaqsController],
  providers: [SettingsService, TestimonialsService, FaqsService],
  exports: [SettingsService, TestimonialsService, FaqsService],
})
export class SettingsModule {}