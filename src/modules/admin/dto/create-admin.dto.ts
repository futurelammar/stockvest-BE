import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ example: 'Second Admin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'admin2@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'AdminPass456!' })
  @MinLength(8)
  password: string;
}