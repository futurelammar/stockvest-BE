import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewStrongPass123!' })
  @MinLength(8)
  newPassword: string;
}