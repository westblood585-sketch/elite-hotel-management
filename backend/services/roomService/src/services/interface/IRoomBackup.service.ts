import { RoomDocument } from '../../models/room.model';

export interface IRoomBackupService {
  getAllRooms(): Promise<RoomDocument[]>;
}
