import { HousekeepingRepository } from '../repository/housekeeping.repository'
import { HousekeepingService } from '../services/implementation/housekeeping.service'
import { HousekeepingController } from '../controllers/housekeeping.controller'
import { RabbitPublisher } from './rabbit.publisher'

export function createContainer() {
  const repo = new HousekeepingRepository()
  const publisher = new RabbitPublisher() // wrapper around getRabbitChannel
  const service = new HousekeepingService(repo, publisher)
  const controller = new HousekeepingController(service)
  return { repo, service, controller, housekeepingService: service }
}
