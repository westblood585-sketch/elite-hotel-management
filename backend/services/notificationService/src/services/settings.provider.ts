
import axios from 'axios';
import logger from '../utils/logger.service';

export class SettingsProvider {
  private cache: Record<string, any> = {};
  private lastFetched: number = 0;
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  async getSetting(key: string): Promise<any> {
    const now = Date.now();
    if (Object.keys(this.cache).length === 0 || now - this.lastFetched > this.CACHE_TTL) {
      await this.refreshSettings();
    }
    return this.cache[key];
  }

  async isEmailEnabled(): Promise<boolean> {
    const val = await this.getSetting('notifications.email');
    // Default to true if not set, or stricter false? Let's assume true for backward compat unless explicitly 'false'
    return val === true || val === 'true'; 
  }

  async isSmsEnabled(): Promise<boolean> {
    const val = await this.getSetting('notifications.sms');
    return val === true || val === 'true';
  }

  private async refreshSettings() {
    try {
      // Assuming UserService runs on port 4002 locally, or use env var
      const baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';
      const response = await axios.get(`${baseUrl}/settings`);
      
      if (response.data && response.data.data) {
        this.cache = response.data.data;
        this.lastFetched = Date.now();
        logger.info('Refreshed notification settings from UserService');
      }
    } catch (error) {
       logger.error('Failed to fetch settings from UserService', error);
       // Keep old cache if available
    }
  }
}

export const settingsProvider = new SettingsProvider();
