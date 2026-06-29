import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}