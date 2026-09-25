import { NextFunction, Request, Response } from 'express'
import { IRoomController } from '../interface/IRoom.controller'
import { IRoomService } from '../../services/interface/IRoom.service'
import { successResponse } from '../../utils/response.handler'
import { HttpStatus } from '../../enums/http.status'

export class RoomController implements IRoomController {
  private roomService: IRoomService
  constructor(roomService: IRoomService) {
    this.roomService = roomService
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const files = (req as any).files as Express.Multer.File[] | undefined
      const result = await this.roomService.createRoom(req.body, files)
      return successResponse(res, HttpStatus.CREATED, 'Room created', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await this.roomService.getRoomById(req.params.id)
      if (!room)
        return successResponse(res, HttpStatus.NOT_FOUND, 'Room not found')
      return successResponse(res, HttpStatus.OK, 'Room fetched', { data: room })
    } catch (err) {
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        type: req.query.type as string | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        available:
          req.query.available != null
            ? req.query.available === 'true'
            : undefined,
        sortBy: (req.query.sortBy as any) || undefined,
        sortOrder: (req.query.sortOrder as any) || undefined,
        search: (req.query.search as string) || undefined,
        sort: req.query.sort ? JSON.parse(req.query.sort as string) : undefined,
      }
      const result = await this.roomService.listRooms(q)
      return successResponse(res, HttpStatus.OK, 'Rooms fetched', result)
    } catch (err) {
      next(err)
    }
  }

  async patch(req: Request, res: Response, next: NextFunction) {
    try {
      const files = (req as any).files as Express.Multer.File[] | undefined
      const result = await this.roomService.patchRoom(
        req.params.id,
        req.body,
        files
      )
      return successResponse(res, HttpStatus.OK, 'Room patched', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await this.roomService.deleteRoom(req.params.id)
      return successResponse(res, HttpStatus.NO_CONTENT, 'Room deleted')
    } catch (err) {
      next(err)
    }
  }
}
