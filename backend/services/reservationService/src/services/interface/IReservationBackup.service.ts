import { ReservationDocument } from '../../models/reservation.model';

export interface IReservationBackupService {
  getAllReservations(): Promise<ReservationDocument[]>;
}
