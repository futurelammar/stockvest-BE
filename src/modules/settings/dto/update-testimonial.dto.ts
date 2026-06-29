import { PartialType } from '@nestjs/swagger';
import { CreateTestimonialDto } from './create-testimonial.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}