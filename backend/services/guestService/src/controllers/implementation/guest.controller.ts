// src/controllers/implementation/guest.controller.ts
import { NextFunction, Request, Response } from 'express'
import { IGuestController } from '../interface/IGuest.controller'
import { IGuestService } from '../../services/interface/IGuest.service'
import { successResponse } from '../../utils/response.handler'
import { HttpStatus } from '../../enums/http.status'

export class GuestController implements IGuestController {
  private guestService: IGuestService
  constructor(guestService: IGuestService) {
    this.guestService = guestService
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined
      const result = await this.guestService.create(req.body, file)
      return successResponse(res, HttpStatus.CREATED, 'Guest created', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const guest = await this.guestService.getById(req.params.id)
      if (!guest)
        return successResponse(res, HttpStatus.NOT_FOUND, 'Guest not found')
      return successResponse(res, HttpStatus.OK, 'Guest fetched', {
        data: guest,
      })
    } catch (err) {
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        search: (req.query.search as string) || undefined,
        isBlacklisted:
          req.query.isBlacklisted != null
            ? req.query.isBlacklisted === 'true'
            : undefined,
        sort: req.query.sort ? JSON.parse(req.query.sort as string) : undefined,
      }
      const result = await this.guestService.list(q)
      return successResponse(res, HttpStatus.OK, 'Guests fetched', result)
    } catch (err) {
      next(err)
    }
  }

  async patch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.guestService.patch(req.params.id, req.body)
      return successResponse(res, HttpStatus.OK, 'Guest patched', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await this.guestService.delete(req.params.id)
      return successResponse(res, HttpStatus.OK, 'Guest deleted')
    } catch (err) {
      next(err)
    }
  }

  async updateIdProofImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined
      const uploaded = await this.guestService.updateIdProofImage(
        req.params.id,
        file!
      )
      return successResponse(res, HttpStatus.OK, 'ID proof image updated', {
        data: uploaded,
      })
    } catch (err) {
      next(err)
    }
  }

  async removeIdProofImage(req: Request, res: Response, next: NextFunction) {
    try {
      await this.guestService.removeIdProofImage(req.params.id)
      return successResponse(res, HttpStatus.OK, 'ID proof image removed')
    } catch (err) {
      next(err)
    }
  }

  async ensureForBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.guestService.ensureGuestForBooking(req.body)
      return successResponse(res, HttpStatus.OK, 'Guest ensured', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }
}
