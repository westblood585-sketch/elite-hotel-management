
import { ISettingService } from '../interface/ISetting.service';
import { SettingRepository } from '../../repositories/implementation/setting.repository';

export class SettingService implements ISettingService {
  private repository: SettingRepository;

  constructor(repository: SettingRepository) {
    this.repository = repository;
  }

  async getSettings(category?: string): Promise<Record<string, any>> {
    const settings = category 
      ? await this.repository.findByCategory(category)
      : await this.repository.findAll();
      
    // Convert array to object map: { key: value }
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async updateSetting(key: string, value: any, updatedBy?: string): Promise<any> {
    // Basic category inference if creating new
    let category = 'general';
    if (key.startsWith('notification')) category = 'notifications';
    if (key.startsWith('security')) category = 'security';
    if (key.startsWith('db')) category = 'database';

    const setting = await this.repository.upsert(key, {
      value,
      category, // Only used on insert
      updatedBy
    });
    
    return setting;
  }

  async initializeDefaults(): Promise<void> {
    const defaults = [
      { key: 'hotelName', value: 'Elite Hotel', category: 'general' },
      { key: 'contactEmail', value: 'admin@elitehotel.com', category: 'general' },
      { key: 'notifications.email', value: true, category: 'notifications' },
      { key: 'notifications.sms', value: false, category: 'notifications' },
      { key: 'security.2fa', value: false, category: 'security' },
      { key: 'security.sessionTimeout', value: 30, category: 'security' },
    ];

    for (const def of defaults) {
      const exists = await this.repository.findByKey(def.key);
      if (!exists) {
        await this.repository.upsert(def.key, def);
      }
    }
  }
}
