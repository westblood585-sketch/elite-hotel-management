import {
  HousekeepingModel,
  HousekeepingTaskDoc,
} from '../models/housekeeping.model'
import { FilterQuery } from 'mongoose'

export class HousekeepingRepository {
  async create(
    data: Partial<HousekeepingTaskDoc>
  ): Promise<HousekeepingTaskDoc> {
    if (data.idempotencyKey) {
      const existing = await HousekeepingModel.findOne({
        idempotencyKey: data.idempotencyKey,
      })
      if (existing) return existing
    }
    const task = new HousekeepingModel(data)
    return task.save()
  }

  async findById(id: string): Promise<HousekeepingTaskDoc | null> {
    return HousekeepingModel.findById(id).exec()
  }

  async update(
    id: string,
    update: Partial<HousekeepingTaskDoc>
  ): Promise<HousekeepingTaskDoc | null> {
    return HousekeepingModel.findByIdAndUpdate(id, update, { new: true }).exec()
  }

  async findPendingByRoom(roomId: string) {
    return HousekeepingModel.find({ roomId, status: 'pending' }).exec()
  }

  async findAndCount(
    filter: FilterQuery<HousekeepingTaskDoc> = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ data: HousekeepingTaskDoc[]; total: number }> {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options
    const [data, total] = await Promise.all([
      HousekeepingModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      HousekeepingModel.countDocuments(filter).exec(),
    ])
    return { data, total }
  }

  async reassignTask(id: string, assignedTo: string, notes?: string) {
    return HousekeepingModel.findByIdAndUpdate(
      id,
      { assignedTo, ...(notes ? { notes } : {}) },
      { new: true }
    ).exec()
  }
}
