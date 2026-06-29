import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestimonialDocument = Testimonial & Document;

@Schema({ timestamps: true })
export class Testimonial {
  @Prop({ required: true })
  name: string;

  @Prop()
  role?: string;

  @Prop()
  photo?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ min: 1, max: 5, default: 5 })
  rating: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);