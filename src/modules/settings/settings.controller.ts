import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all public site settings' })
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key (e.g. homepage, contact_info)' })
  getByKey(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @Put(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Create or update a setting by key' })
  upsert(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.upsert(key, dto);
  }
}