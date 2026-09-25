import { Router } from 'express';
import { ReservationBackupController } from '../controllers/implementation/reservationBackup.controller';
import { ReservationBackupService } from '../services/implementation/reservationBackup.service';

const router = Router();
const reservationBackupService = new ReservationBackupService();
const reservationBackupController = new ReservationBackupController(reservationBackupService);

router.get('/export', (req, res, next) => reservationBackupController.exportReservations(req, res, next));

export default router;
