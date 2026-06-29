import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(@InjectModel(Faq.name) private faqModel: Model<FaqDocument>) {}

  async create(dto: CreateFaqDto) {
    return this.faqModel.create(dto);
  }

  async findAllActive() {
    return this.faqModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  }

  async findAllAdmin() {
    return this.faqModel.find().sort({ order: 1, createdAt: 1 });
  }

  async update(id: string, dto: UpdateFaqDto) {
    const faq = await this.faqModel.findByIdAndUpdate(id, dto, { new: true });
    if (!faq) throw new NotFoundException('FAQ not found');
    return faq;
  }

  async remove(id: string) {
    const faq = await this.faqModel.findByIdAndDelete(id);
    if (!faq) throw new NotFoundException('FAQ not found');
    return { message: 'FAQ deleted' };
  }
}