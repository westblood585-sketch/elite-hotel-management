// src/config/container.ts
// add these imports at top
import { UserRepository } from '../repositories/implementation/user.repository'
import { UserService } from '../services/implementation/user.service'
import { UserController } from '../controllers/implementation/user.controller'
import { MediaService } from '../services/implementation/media.service' // already exist in your repo
import { User } from '../models/user.model'

// repositories
const userRepository = new UserRepository(User)
import { Setting } from '../models/setting.model'
import { SettingRepository } from '../repositories/implementation/setting.repository'
const settingRepository = new SettingRepository(Setting)

// services
const mediaService = new MediaService()
import { UserEventPublisher } from '../publishers/user.publisher'
const userEventPublisher = new UserEventPublisher()
const userService = new UserService(userRepository, mediaService, userEventPublisher)
import { SettingService } from '../services/implementation/setting.service'
const settingService = new SettingService(settingRepository)

// controllers
const userController = new UserController(userService)
import { SettingController } from '../controllers/implementation/setting.controller'
const settingController = new SettingController(settingService)

export { userRepository, userService, userController, mediaService, settingController }
