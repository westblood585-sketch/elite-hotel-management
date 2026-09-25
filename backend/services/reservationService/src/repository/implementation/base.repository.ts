import { IBaseRepository } from '../interface/IBase.repository'
import { Model, Document } from 'mongoose'

class BaseRepository<T extends Document> implements IBaseRepository<T> {
  private model: Model<T>

  constructor(model: Model<T>) {
    this.model = model
  }
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data)
  }
  async findAll(filter: any = {}, options: any = {}): Promise<T[]> {
    const query = this.model.find(filter)
    
    if (options.skip) query.skip(options.skip)
    if (options.limit) query.limit(options.limit)
    if (options.sort) query.sort(options.sort)
    
    return query.exec()
  }
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id)
  }
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true })
  }
  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id)
  }
  async count(filter: any = {}): Promise<number> {
    return this.model.countDocuments(filter).exec()
  }
}

export default BaseRepository
