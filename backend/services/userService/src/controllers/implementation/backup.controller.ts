import { Request, Response, NextFunction } from 'express';
import { IBackupController } from '../interface/IBackup.controller';
import { IBackupService } from '../../services/interface/IBackup.service';
import { BackupService } from '../../services/implementation/backup.service';

export class BackupController implements IBackupController {
  private backupService: IBackupService;

  constructor() {
    this.backupService = new BackupService();
  }

  async createBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filename = await this.backupService.createBackup();
      res.status(200).json({
        success: true,
        message: 'Backup created successfully',
        data: { filename },
      });
    } catch (error) {
       next(error);
    }
  }

  async getBackupStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = this.backupService.getBackupConfig();
      res.status(200).json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  async getBackups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const backups = await this.backupService.getBackups();
      res.status(200).json({
        success: true,
        data: backups,
      });
    } catch (error) {
      console.error("Failed to fetch backups", error);
      res.status(500).json({ success: false, message: 'Failed to fetch backups', error });
    }
  }

  async downloadBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;
      const filepath = await this.backupService.getBackupPath(filename);
      res.download(filepath, filename);
    } catch (error: any) {
      console.error("Failed to download backup", error);
      if (error.message === 'Backup file not found') {
        res.status(404).json({ success: false, message: 'Backup not found' });
      } else if (error.message === 'Invalid backup filename') {
        res.status(400).json({ success: false, message: 'Invalid filename' });
      } else {
        res.status(500).json({ success: false, message: 'Download failed', error });
      }
    }
  }
}
