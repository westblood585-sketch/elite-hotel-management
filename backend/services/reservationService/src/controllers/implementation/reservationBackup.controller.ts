import { Request, Response, NextFunction } from 'express';
import { IReservationBackupController } from '../interface/IReservationBackup.controller';
import { IReservationBackupService } from '../../services/interface/IReservationBackup.service';

export class ReservationBackupController implements IReservationBackupController {
  constructor(private reservationBackupService: IReservationBackupService) {}

  async exportReservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reservations = await this.reservationBackupService.getAllReservations();
      res.status(200).json({ success: true, data: reservations });
    } catch (error) {
      next(error);
    }
  }
}
