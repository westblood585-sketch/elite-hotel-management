import { GuestDocument } from '../../models/guest.model';

export interface IGuestBackupService {
  getAllGuests(): Promise<GuestDocument[]>;
}
