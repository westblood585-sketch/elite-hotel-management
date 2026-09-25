import { BaseRepository } from './base.repository'
import { IRoomRepository } from '../interface/IRoom.repository'
import { Room, RoomDocument } from '../../models/room.model'

export class RoomRepository
  extends BaseRepository<RoomDocument>
  implements IRoomRepository
{
  constructor() {
    super(Room)
  }
  findByNumber(number: number): Promise<RoomDocument | null> {
    return this.model.findOne({ number }).exec()
  }
}
