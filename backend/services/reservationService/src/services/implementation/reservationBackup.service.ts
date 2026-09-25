import { Reservation, ReservationDocument } from '../../models/reservation.model';
import { IReservationBackupService } from '../interface/IReservationBackup.service';

export class ReservationBackupService implements IReservationBackupService {
  async getAllReservations(): Promise<ReservationDocument[]> {
    return await Reservation.find({});
  }
}
