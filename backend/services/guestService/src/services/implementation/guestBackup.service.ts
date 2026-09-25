import { Guest, GuestDocument } from '../../models/guest.model';
import { IGuestBackupService } from '../interface/IGuestBackup.service';

export class GuestBackupService implements IGuestBackupService {
  async getAllGuests(): Promise<GuestDocument[]> {
    return await Guest.find({});
  }
}
