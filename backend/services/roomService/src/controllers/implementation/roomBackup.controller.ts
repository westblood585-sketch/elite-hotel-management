import { Request, Response, NextFunction } from 'express';
import { IRoomBackupController } from '../interface/IRoomBackup.controller';
import { IRoomBackupService } from '../../services/interface/IRoomBackup.service';

export class RoomBackupController implements IRoomBackupController {
  constructor(private roomBackupService: IRoomBackupService) {}

  async exportRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await this.roomBackupService.getAllRooms();
      res.status(200).json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }
}
