
import { Model } from 'mongoose';
import { ISetting, Setting } from '../../models/setting.model';

export class SettingRepository {
  private model: Model<ISetting>;

  constructor(model: Model<ISetting>) {
    this.model = model;
  }

  async findByKey(key: string): Promise<ISetting | null> {
    return this.model.findOne({ key });
  }

  async findAll(): Promise<ISetting[]> {
    return this.model.find({});
  }

  async findByCategory(category: string): Promise<ISetting[]> {
    return this.model.find({ category });
  }

  async upsert(key: string, data: Partial<ISetting>): Promise<ISetting> {
    return this.model.findOneAndUpdate(
      { key },
      { $set: data },
      { new: true, upsert: true }
    ) as Promise<ISetting>;
  }
}
