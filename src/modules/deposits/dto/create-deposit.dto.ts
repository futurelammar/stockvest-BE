import { IsMongoId, IsNumber, Min, IsUrl, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepositDto {
  @ApiProperty({ example: '665f1c2e8b3a9d0012345678' })
  @IsMongoId()
  walletId: string;

  @ApiProperty({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'https://res.cloudinary.com/your-cloud/image/upload/v123/general-uploads/proof.jpg',
    description: 'URL returned from POST /uploads/image',
  })
  @IsNotEmpty()
  @IsUrl()
  proofUrl: string;
}