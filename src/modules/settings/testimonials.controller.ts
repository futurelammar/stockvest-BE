import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'List active testimonials (public)' })
  findAllActive() {
    return this.testimonialsService.findAllActive();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all testimonials including inactive' })
  findAllAdmin() {
    return this.testimonialsService.findAllAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Create a testimonial' })
  create(
    @Body() dto: CreateTestimonialDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    photoFile?: Express.Multer.File,
  ) {
    return this.testimonialsService.create(dto, photoFile);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  @ApiOperation({ summary: '[Admin] Update a testimonial' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestimonialDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    photoFile?: Express.Multer.File,
  ) {
    return this.testimonialsService.update(id, dto, photoFile);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Delete a testimonial' })
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}