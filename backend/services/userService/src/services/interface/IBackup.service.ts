export interface IBackupLog {
  filename: string;
  createdAt: Date;
  size: number;
}

export interface IBackupConfig {
  enabled: boolean;
  retentionDays: number;
  nextRun: Date;
}

export interface IBackupService {
  createBackup(): Promise<string>;
  getBackups(): Promise<IBackupLog[]>;
  getBackupPath(filename: string): Promise<string>;
  cleanupOldBackups(retentionDays: number): Promise<number>;
  getBackupConfig(): IBackupConfig;
}
