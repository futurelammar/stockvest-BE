import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminSetupDto {
  @ApiProperty({ example: 'Super Admin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'AdminPass123!' })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'your-secret-setup-key', description: 'Must match ADMIN_SETUP_SECRET in .env' })
  @IsString()
  @IsNotEmpty()
  setupSecret: string;
}