import { Router } from 'express';
import { RoomBackupController } from '../controllers/implementation/roomBackup.controller';
import { RoomBackupService } from '../services/implementation/roomBackup.service';

const router = Router();
const roomBackupService = new RoomBackupService();
const roomBackupController = new RoomBackupController(roomBackupService);

router.get('/export', (req, res, next) => roomBackupController.exportRooms(req, res, next));

export default router;
