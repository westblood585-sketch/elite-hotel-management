import { Request, Response, NextFunction } from 'express';

export interface IReservationBackupController {
  exportReservations(req: Request, res: Response, next: NextFunction): Promise<void>;
}
