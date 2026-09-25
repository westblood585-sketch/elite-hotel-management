
import { Request, Response, NextFunction } from 'express';
import { ISettingService } from '../../services/interface/ISetting.service';

export class SettingController {
  private service: ISettingService;

  constructor(service: ISettingService) {
    this.service = service;
  }

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string;
      const settings = await this.service.getSettings(category);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const updatedBy = (req as any).user?.userId;
      
      const setting = await this.service.updateSetting(key, value, updatedBy);
      res.json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  }
  
  // Endpoint to seed defaults if needed
  async seedDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.initializeDefaults();
      res.json({ success: true, message: 'Defaults initialized' });
    } catch (error) {
      next(error);
    }
  }
}
