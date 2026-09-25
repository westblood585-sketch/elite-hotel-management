import { Room, RoomDocument } from '../../models/room.model';
import { IRoomBackupService } from '../interface/IRoomBackup.service';

export class RoomBackupService implements IRoomBackupService {
  async getAllRooms(): Promise<RoomDocument[]> {
    return await Room.find({});
  }
}
