import fs from 'fs/promises';
import path from 'path';
import { IBackupService, IBackupLog } from '../interface/IBackup.service';
import { User } from '../../models/user.model';
import { Setting } from '../../models/setting.model';

export class BackupService implements IBackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
  }

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<string> {
    await this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    // 1. Fetch Local Data
    const users = await User.find({});
    const settings = await Setting.find({});

    // 2. Fetch Remote Data
    const [guests, rooms, reservations] = await Promise.all([
      this.fetchFromService('http://localhost:4004/guest-backup/export'),
      this.fetchFromService('http://localhost:4003/room-backup/export'),
      this.fetchFromService('http://localhost:4005/reservation-backup/export'),
    ]);

    const backupData = {
      timestamp: new Date(),
      version: '1.0',
      data: {
        users,
        settings,
        guests,
        rooms,
        reservations,
      },
    };

    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
    return filename;
  }

  private async fetchFromService(url: string): Promise<any[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch from ${url}: ${response.statusText}`);
        return [];
      }
      const json: any = await response.json();
      return json.success ? json.data : [];
    } catch (error) {
      console.error(`Error fetching from ${url}`, error);
      return [];
    }
  }

  async getBackups(): Promise<IBackupLog[]> {
    await this.ensureBackupDir();

    const files = await fs.readdir(this.backupDir);
    const backups: IBackupLog[] = [];

    for (const file of files) {
      if (file.endsWith('.json') && file.startsWith('backup-')) {
        const stats = await fs.stat(path.join(this.backupDir, file));
        backups.push({
          filename: file,
          createdAt: stats.birthtime,
          size: stats.size,
        });
      }
    }

    // Sort by newest first
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBackupPath(filename: string): Promise<string> {
    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    if (!safeFilename.startsWith('backup-') || !safeFilename.endsWith('.json')) {
      throw new Error('Invalid backup filename');
    }

    const filepath = path.join(this.backupDir, safeFilename);
    try {
      await fs.access(filepath);
      return filepath;
    } catch {
      throw new Error('Backup file not found');
    }
  }

  async cleanupOldBackups(retentionDays: number): Promise<number> {
    const logs = await this.getBackups();
    const now = new Date();
    let deletedCount = 0;

    for (const log of logs) {
      const diffTime = Math.abs(now.getTime() - log.createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > retentionDays) {
        try {
          await fs.unlink(path.join(this.backupDir, log.filename));
          deletedCount++;
          console.log(`Deleted old backup: ${log.filename}`);
        } catch (error) {
          console.error(`Failed to delete backup ${log.filename}`, error);
        }
      }
    }
    return deletedCount;
  }

  getBackupConfig(): IBackupConfig {
    // Calculate next run (Midnight)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(24, 0, 0, 0); // Next midnight

    return {
      enabled: true,
      retentionDays: 30,
      nextRun,
    };
  }
}
import { IBackupConfig } from '../interface/IBackup.service';
