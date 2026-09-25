import { RoomDocument } from '../../models/room.model'
import { IBaseRepository } from './IBase.repository'

export interface IRoomRepository extends IBaseRepository<RoomDocument> {
  findByNumber(number: number): Promise<RoomDocument | null>
}
