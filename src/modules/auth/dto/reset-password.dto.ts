import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewStrongPass123!' })
  @MinLength(8)
  newPassword: string;
}