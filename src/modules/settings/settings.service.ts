import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<SettingDocument>) {}

  async getByKey(key: string) {
    const setting = await this.settingModel.findOne({ key });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async getAll() {
    return this.settingModel.find();
  }

  // Upsert — admin can create or update a setting key in one call
  async upsert(key: string, dto: UpdateSettingDto) {
    return this.settingModel.findOneAndUpdate(
      { key },
      { key, value: dto.value },
      { new: true, upsert: true },
    );
  }
}