import { Request, Response, NextFunction } from 'express';

export interface IRoomBackupController {
  exportRooms(req: Request, res: Response, next: NextFunction): Promise<void>;
}
