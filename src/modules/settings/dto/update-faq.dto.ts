import { PartialType } from '@nestjs/swagger';
import { CreateFaqDto } from './create-faq.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFaqDto extends PartialType(CreateFaqDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}