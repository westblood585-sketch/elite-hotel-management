import express from 'express';
import { BackupController } from '../controllers/implementation/backup.controller';

const router = express.Router();
const backupController = new BackupController();

router.post('/', (req, res, next) => backupController.createBackup(req, res, next));
router.get('/', (req, res, next) => backupController.getBackups(req, res, next));
router.get('/status', (req, res, next) => backupController.getBackupStatus(req, res, next));
router.get('/:filename', (req, res, next) => backupController.downloadBackup(req, res, next));

export default router;
