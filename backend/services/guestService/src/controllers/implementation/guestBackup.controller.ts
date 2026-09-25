import { Request, Response, NextFunction } from 'express';
import { IGuestBackupController } from '../interface/IGuestBackup.controller';
import { IGuestBackupService } from '../../services/interface/IGuestBackup.service';

export class GuestBackupController implements IGuestBackupController {
  constructor(private guestBackupService: IGuestBackupService) {}

  async exportGuests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const guests = await this.guestBackupService.getAllGuests();
      res.status(200).json({ success: true, data: guests });
    } catch (error) {
      next(error);
    }
  }
}
