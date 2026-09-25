import { Router } from 'express';
import { GuestBackupController } from '../controllers/implementation/guestBackup.controller';
import { GuestBackupService } from '../services/implementation/guestBackup.service';

const router = Router();
const guestBackupService = new GuestBackupService();
const guestBackupController = new GuestBackupController(guestBackupService);

router.get('/export', (req, res, next) => guestBackupController.exportGuests(req, res, next));

export default router;
