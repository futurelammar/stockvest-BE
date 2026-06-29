import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Investor' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: 'This platform changed how I invest. Highly recommend!' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}