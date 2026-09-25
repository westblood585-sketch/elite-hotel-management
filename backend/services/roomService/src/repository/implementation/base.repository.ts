import { Model, Document } from 'mongoose'
import { IBaseRepository } from '../interface/IBase.repository'

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>
  constructor(model: Model<T>) {
    this.model = model
  }

  create(data: Partial<T>): Promise<T> {
    return this.model.create(data)
  }

  findAll(filter: any = {}, options: any = {}): Promise<T[]> {
    const {
      skip = 0,
      limit = 20,
      sort = { createdAt: -1 },
      projection = {},
    } = options
    return this.model
      .find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec()
  }

  findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec()
  }

  findOne(filter: any): Promise<T | null> {
    return this.model.findOne(filter).exec()
  }

  update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
      .exec()
  }

  patch(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec()
  }

  delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec()
  }

  count(filter: any = {}): Promise<number> {
    return this.model.countDocuments(filter).exec()
  }
}
