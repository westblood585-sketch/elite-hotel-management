import { Request, Response, NextFunction } from 'express';

export interface IGuestBackupController {
  exportGuests(req: Request, res: Response, next: NextFunction): Promise<void>;
}
