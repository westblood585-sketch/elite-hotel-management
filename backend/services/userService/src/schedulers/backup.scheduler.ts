import cron from 'node-cron';
import { IBackupService } from '../services/interface/IBackup.service';

export class BackupScheduler {
  constructor(private backupService: IBackupService) {}

  start() {
    // Run every day at 00:00 (Midnight)
    cron.schedule('0 0 * * *', async () => {
      console.log('⏰ Starting automated daily backup...');
      try {
        const filename = await this.backupService.createBackup();
        console.log(`✅ Automated backup created: ${filename}`);

        console.log('🧹 Starting cleanup of old backups...');
        const retentionDays = 30; // 30 Day Retention Policy
        const deleted = await this.backupService.cleanupOldBackups(retentionDays);
        if (deleted > 0) {
            console.log(`🗑️ Deleted ${deleted} old backup(s).`);
        }
      } catch (error) {
        console.error('❌ Automated backup failed:', error);
      }
    });

    console.log('📅 Backup Scheduler active: Running daily at 00:00');
  }
}
