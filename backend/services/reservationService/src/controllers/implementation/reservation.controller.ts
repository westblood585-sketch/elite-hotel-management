// src/controllers/implementation/reservation.controller.ts
import { NextFunction, Request, Response } from 'express'
import { IReservationController } from '../interface/IReservation.controller'
import { IReservationService } from '../../services/interface/IReservation.service'
import { successResponse } from '../../utils/response.handler'
import { HttpStatus } from '../../enums/http.status'
import { CustomeRequest } from '../../interfaces/CustomRequest'

export class ReservationController implements IReservationController {
  private svc: IReservationService
  constructor(svc: IReservationService) {
    this.svc = svc
  }

  async quote(req: CustomeRequest, res: Response, next: NextFunction) {
    try {
      const { roomId, checkIn, checkOut, currency, promoCode } = req.body
      const result = await this.svc.quote({
        roomId,
        checkIn,
        checkOut,
        currency,
        promoCode,
      })
      return successResponse(res, HttpStatus.OK, 'Quote calculated', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.svc.checkAvailability(req.body)
      return successResponse(res, HttpStatus.OK, 'Availability checked', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async create(req: CustomeRequest, res: Response, next: NextFunction) {
    try {
      const createdBy = (req.user as any)?.id
      const jwtToken = (req.headers.authorization || '').replace('Bearer ', '')

      const result = await this.svc.create(req.body, createdBy, jwtToken)
      return successResponse(res, HttpStatus.CREATED, 'Reservation created', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  // For guest (online) bookings
  async createPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.svc.createPublic(req.body)
      return successResponse(res, HttpStatus.CREATED, 'Reservation created', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async lookupGuest(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phoneNumber } = req.body
      const result = await this.svc.lookupGuest(email, phoneNumber)
      if (!result) {
        return successResponse(
          res,
          HttpStatus.NOT_FOUND,
          'Guest not found',
          null
        )
      }
      return successResponse(res, HttpStatus.OK, 'Guest found', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async getById(req: CustomeRequest, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.getById(req.params.id)
      if (!r)
        return successResponse(
          res,
          HttpStatus.NOT_FOUND,
          'Reservation not found'
        )

      // Authorization Check
      const user = req.user as any
      const isStaff = ['admin', 'receptionist'].includes(user?.role)
      const isOwner = r.createdBy?.toString() === user?.id

      if (!isStaff && !isOwner) {
        console.warn(`[Access Denied] User: ${user?.id}, Role: ${user?.role}, Reservation Owner: ${r.createdBy}`)
        return next({
           message: 'You are not authorized to view this reservation',
           status: HttpStatus.FORBIDDEN
        })
      }

      return successResponse(res, HttpStatus.OK, 'Reservation fetched', {
        data: r,
      })
    } catch (err) {
      next(err)
    }
  }

  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.getByCode(req.params.code)
      if (!r)
        return successResponse(
          res,
          HttpStatus.NOT_FOUND,
          'Reservation not found'
        )
      return successResponse(res, HttpStatus.OK, 'Reservation fetched', {
        data: r,
      })
    } catch (err) {
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.svc.list({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        status: (req.query.status as string) || undefined,
        guestId: (req.query.guestId as string) || undefined,
        roomId: (req.query.roomId as string) || undefined,
        dateFrom: req.query.dateFrom
          ? new Date(req.query.dateFrom as string)
          : undefined,
        dateTo: req.query.dateTo
          ? new Date(req.query.dateTo as string)
          : undefined,
        search: (req.query.search as string) || undefined,
        sort: req.query.sort ? JSON.parse(req.query.sort as string) : undefined,
      })
      return successResponse(res, HttpStatus.OK, 'Reservations fetched', result)
    } catch (err) {
      next(err)
    }
  }

  async patch(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.patch(req.params.id, req.body)
      return successResponse(res, HttpStatus.OK, 'Reservation patched', {
        data: r,
      })
    } catch (err) {
      next(err)
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.confirm(req.params.id)
      return successResponse(res, HttpStatus.OK, 'Reservation confirmed', {
        data: r,
      })
    } catch (err) {
      next(err)
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.cancel(req.params.id, req.body?.reason)
      return successResponse(res, HttpStatus.OK, 'Reservation cancelled', {
        data: r,
      })
    } catch (err) {
      next(err)
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.checkIn(req.params.id)
      return successResponse(res, HttpStatus.OK, 'Checked in', { data: r })
    } catch (err) {
      next(err)
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await this.svc.checkOut(req.params.id)
      return successResponse(res, HttpStatus.OK, 'Checked out', { data: r })
    } catch (err) {
      next(err)
    }
  }

  async myReservations(req: CustomeRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id
      const result = await this.svc.getUserReservations(userId)
      return successResponse(res, HttpStatus.OK, 'My reservations fetched', {
        data: result,
      })
    } catch (err) {
      next(err)
    }
  }

  async publicLookup(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, contact } = req.body
      if (!code || !contact) {
        return next({
          message: 'Code and contact (email/phone) are required',
          status: HttpStatus.BAD_REQUEST
        })
      }

      const result = await this.svc.publicLookup(code, contact)
      if (!result) {
        return successResponse(res, HttpStatus.NOT_FOUND, 'Booking not found or details mismatch', null)
      }

      return successResponse(res, HttpStatus.OK, 'Booking found', {
        data: result
      })
    } catch (err) {
      next(err)
    }
  }
}
