
import { ISetting } from '../../models/setting.model';

export interface ISettingService {
  getSettings(category?: string): Promise<Record<string, any>>;
  updateSetting(key: string, value: any, updatedBy?: string): Promise<ISetting>;
  initializeDefaults(): Promise<void>;
}
