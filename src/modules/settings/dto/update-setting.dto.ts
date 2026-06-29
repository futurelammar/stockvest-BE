import { IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    example: { heroTitle: 'Invest Smarter', heroSubtitle: 'Grow your wealth with stock plans' },
    description: 'Arbitrary key-value content for this setting key',
  })
  @IsNotEmpty()
  @IsObject()
  value: Record<string, any>;
}