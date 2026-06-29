import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testimonial, TestimonialDocument } from './schemas/testimonial.schema';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { CloudinaryService } from '../../uploads/cloudinary/cloudinary.service';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectModel(Testimonial.name) private testimonialModel: Model<TestimonialDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateTestimonialDto, photoFile?: Express.Multer.File) {
    let photo: string | undefined;
    if (photoFile) {
      const result = await this.cloudinaryService.uploadImage(photoFile, 'testimonials');
      photo = result.secure_url;
    }
    return this.testimonialModel.create({ ...dto, photo });
  }

  async findAllActive() {
    return this.testimonialModel.find({ isActive: true }).sort({ createdAt: -1 });
  }

  async findAllAdmin() {
    return this.testimonialModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, dto: UpdateTestimonialDto, photoFile?: Express.Multer.File) {
    const testimonial = await this.testimonialModel.findById(id);
    if (!testimonial) throw new NotFoundException('Testimonial not found');

    if (photoFile) {
      const result = await this.cloudinaryService.uploadImage(photoFile, 'testimonials');
      testimonial.photo = result.secure_url;
    }

    Object.assign(testimonial, dto);
    await testimonial.save();
    return testimonial;
  }

  async remove(id: string) {
    const testimonial = await this.testimonialModel.findByIdAndDelete(id);
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return { message: 'Testimonial deleted' };
  }
}