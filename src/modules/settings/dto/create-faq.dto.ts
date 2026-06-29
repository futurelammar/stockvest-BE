import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({ example: 'How long does it take to verify my account?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'Verification is instant once you click the link in your email.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}