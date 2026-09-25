import { Request, Response, NextFunction } from 'express';

export interface IBackupController {
  createBackup(req: Request, res: Response, next: NextFunction): Promise<void>;
  getBackups(req: Request, res: Response, next: NextFunction): Promise<void>;
  downloadBackup(req: Request, res: Response, next: NextFunction): Promise<void>;
  getBackupStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
