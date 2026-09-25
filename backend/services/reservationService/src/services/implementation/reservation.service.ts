// src/services/implementation/reservation.service.ts
import {
  IReservationService,
  CreateReservationInput,
  QuoteRequest,
  IRoomLookupService,
  IPaymentOrchestrator,
} from '../interface/IReservation.service'
import { IReservationRepository } from '../../repository/interface/IReservation.repository'
import { ReservationDocument } from '../../models/reservation.model'
import CustomError from '../../utils/CustomError'
import { HttpStatus } from '../../enums/http.status'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { GuestRpcClient } from '../adapters/guestRpcClient.adapter'
import { getRabbitChannel } from '../../config/rabbitmq.config'
import { IPricingEngine } from '../interface/IPricingEngine'
import { context } from '../../utils/context'
dayjs.extend(utc)

function generateCode(): string {
  const stamp = dayjs().utc().format('YYYYMMDD')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RSV-${stamp}-${rand}`
}

export class ReservationService implements IReservationService {
  private repo: IReservationRepository
  private roomLookup: IRoomLookupService
  private pricingEngine: IPricingEngine
  private payments: IPaymentOrchestrator
  private guestRpc: GuestRpcClient
  private channelP: Promise<any>

  constructor(
    repo: IReservationRepository,
    roomLookup: IRoomLookupService,
    pricingEngine: IPricingEngine,
    payments: IPaymentOrchestrator,
    guestRpcClient?: GuestRpcClient
  ) {
    this.repo = repo
    this.roomLookup = roomLookup
    this.pricingEngine = pricingEngine
    this.payments = payments
    this.guestRpc = guestRpcClient || new GuestRpcClient()
    this.channelP = getRabbitChannel()
  }

  private normalizeDates(input: { checkIn: any; checkOut: any }) {
    const checkIn = dayjs(input.checkIn).startOf('day').toDate()
    const checkOut = dayjs(input.checkOut).startOf('day').toDate()
    return { checkIn, checkOut }
  }

  private diffNights(checkIn: Date, checkOut: Date) {
    const nights = Math.round((+checkOut - +checkIn) / (1000 * 60 * 60 * 24))
    return nights
  }

  async quote(input: QuoteRequest, jwtToken?: string) {
    const { roomId, currency, promoCode } = input
    const { checkIn, checkOut } = this.normalizeDates(input)
    if (!(checkIn < checkOut))
      throw new CustomError(
        'checkOut must be after checkIn',
        HttpStatus.BAD_REQUEST
      )

    const nights = this.diffNights(checkIn, checkOut)
    if (nights < 1)
      throw new CustomError('Minimum 1 night', HttpStatus.BAD_REQUEST)

    // Fetch current base price from RoomService
    const room = await this.roomLookup.ensureRoomExists(roomId)
    const baseRate = room.price

    // Delegate pricing calculation to the pricing engine
    const quote = await this.pricingEngine.calculate({
      roomId,
      checkIn,
      checkOut,
      baseRate,
      currency,
      promoCode,
    })

    return quote
  }

  async create(input: CreateReservationInput, createdBy?: string) {
    const { checkIn, checkOut } = this.normalizeDates(input)
    if (!(checkIn < checkOut))
      throw new CustomError(
        'checkOut must be after checkIn',
        HttpStatus.BAD_REQUEST
      )

    const nights = this.diffNights(checkIn, checkOut)
    if (nights < 1)
      throw new CustomError('Minimum 1 night', HttpStatus.BAD_REQUEST)
    if (!input.guestId && input.guestDetails) {
      try {
        const guest = await this.guestRpc.findOrCreateGuest(input.guestDetails)
        if (guest && guest._id) {
          input.guestId = guest._id
        }
      } catch (err) {
        // Fall through; subsequent checks will fail if guestId is still missing
      }
    }

    if (!input.guestId)
      throw new CustomError('guestId required', HttpStatus.BAD_REQUEST)
    if (!input.roomId)
      throw new CustomError('roomId required', HttpStatus.BAD_REQUEST)

    // Room must exist
    const room = await this.roomLookup.ensureRoomExists(input.roomId)
    if (!room) {
      throw new CustomError('Room not found', HttpStatus.NOT_FOUND)
    }
    if (!room.available) {
      throw new CustomError('Room is not available', HttpStatus.CONFLICT)
    }

    // Overlap validation − avoid double-booking
    const overlaps = await this.repo.findOverlaps({
      roomId: input.roomId,
      checkIn,
      checkOut,
      includeStatuses: ['PendingPayment', 'Confirmed', 'CheckedIn'],
    })
    if (overlaps.length) {

      
      throw new CustomError(
        'Room not available for the selected dates',
        HttpStatus.CONFLICT
      )
    }

    const quote = await this.quote({
      roomId: input.roomId,
      checkIn,
      checkOut,
      adults: input.adults,
      children: input.children,
      currency: input.currency,
    })

    const code = generateCode()
    const doc = await this.repo.create({
      code,
      guestId: input.guestId,
      roomId: input.roomId,
      checkIn,
      checkOut,
      nights,
      adults: input.adults,
      children: input.children || 0,
      status: input.requiresPrepayment ? 'PendingPayment' : 'Confirmed',
      source: input.source || 'FrontDesk',
      notes: input.notes,
      currency: quote.currency,
      baseRate: quote.baseRate,
      taxes: quote.taxes,
      fees: quote.fees,
      totalAmount: quote.total,
      requiresPrepayment: !!input.requiresPrepayment,
      paymentProvider: input.paymentProvider,
      createdBy,
      holdExpiresAt: input.requiresPrepayment
        ? dayjs().utc().add(30, 'minute').toDate()
        : undefined,
    } as any)

    // Prepayment hook (Stripe/Razorpay) - create intent/order
    let paymentClientSecret: string | undefined
    let paymentOrder: any | undefined
    if (input.requiresPrepayment && input.paymentProvider && input.paymentProvider !== 'Offline') {
      const pay = await this.payments.createPaymentIntent({
        provider: input.paymentProvider as 'Stripe' | 'Razorpay',
        amount: doc.totalAmount,
        currency: doc.currency,
        reservationCode: doc.code,
        customer: { guestId: doc.guestId.toString() },
        metadata: { reservationId: doc._id.toString() },
      })

      // Save provider reference
      await this.repo.update(doc._id.toString(), {
        paymentProvider: pay.provider,
        paymentIntentId: pay.id,
      } as any)

      // expose provider-specific fields
      paymentClientSecret = pay.clientSecret // Stripe
      paymentOrder = pay.extra // Razorpay order payload
    }

    // 1) Fetch guest contact once via RPC
    try {
      const contact = await this.guestRpc.getContactDetails(
        doc.guestId.toString()
      )
      if (contact) {
        await this.repo.update(doc._id.toString(), {
          guestContact: {
            email: contact.email,
            phoneNumber: contact.phoneNumber,
          },
        } as any)
        doc.guestContact = {
          email: contact.email,
          phoneNumber: contact.phoneNumber,
        } as any
      }
    } catch (err) {
      console.warn('Guest RPC failed', err)
    }

    // 2) Publish reservation.created event
    const ch = await this.channelP
    const eventPayload = {
      event: 'reservation.created',
      data: {
        reservationId: doc._id.toString(),
        code: doc.code,
        guestId: doc.guestId,
        guestContact: doc.guestContact ? { ...doc.guestContact } : null,
        roomId: doc.roomId,
        checkIn: doc.checkIn,
        checkOut: doc.checkOut,
        totalAmount: doc.totalAmount,
        currency: doc.currency,
      },
      createdAt: new Date().toISOString(),
    }
    ch.publish(
      'reservations.events',
      'reservation.created',
      Buffer.from(JSON.stringify(eventPayload)),
      { 
        persistent: true,
        headers: { correlationId: context.getStore()?.get('correlationId') }
      }
    )

    // return document plus any client secret/order details for frontend
    return Object.assign(doc.toObject(), {
      paymentClientSecret,
      paymentOrder,
    })
  }

  async createPublic(input: CreateReservationInput) {
    const { checkIn, checkOut } = this.normalizeDates(input)
    if (!(checkIn < checkOut))
      throw new CustomError(
        'checkOut must be after checkIn',
        HttpStatus.BAD_REQUEST
      )

    const nights = this.diffNights(checkIn, checkOut)
    if (nights < 1)
      throw new CustomError('Minimum 1 night', HttpStatus.BAD_REQUEST)
    if (nights < 1)
      throw new CustomError('Minimum 1 night', HttpStatus.BAD_REQUEST)

    let guestId = input.guestId

    // If no guestId, but we have details, create/find guest via RPC
    if (!guestId && input.guestDetails) {
      try {
        const guest = await this.guestRpc.findOrCreateGuest(input.guestDetails)
        if (guest && guest._id) {
          guestId = guest._id
        } else {
          throw new Error('Failed to create guest')
        }
      } catch (err) {
        throw new CustomError(
          'Failed to process guest details',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }
    }

    if (!guestId)
      throw new CustomError('guestId required', HttpStatus.BAD_REQUEST)

    if (!input.roomId)
      throw new CustomError('roomId required', HttpStatus.BAD_REQUEST)
    if (!input.roomId)
      throw new CustomError('roomId required', HttpStatus.BAD_REQUEST)

    // Ensure room exists
    const room = await this.roomLookup.ensureRoomExists(input.roomId)
    if (!room) {
      throw new CustomError('Room not found', HttpStatus.NOT_FOUND)
    }
    if (!room.available) {
      throw new CustomError('Room is not available', HttpStatus.CONFLICT)
    }

    // Check overlap
    const overlaps = await this.repo.findOverlaps({
      roomId: input.roomId,
      checkIn,
      checkOut,
      includeStatuses: ['PendingPayment', 'Confirmed', 'CheckedIn'],
    })
    if (overlaps.length) {
      // Check if this is a retry by the same guest for the same room/dates
      const pendingMatch = overlaps.find(
        (r) =>
          r.status === 'PendingPayment' &&
          r.guestId.toString() === guestId?.toString() &&
          r.roomId.toString() === input.roomId.toString() &&
          r.checkIn.getTime() === checkIn.getTime() &&
          r.checkOut.getTime() === checkOut.getTime()
      )

      if (pendingMatch) {
        // Reuse logic: Generate new payment intent for the existing reservation
        let paymentClientSecret: string | undefined
        let paymentOrder: any | undefined

        if (input.requiresPrepayment && input.paymentProvider && input.paymentProvider !== 'Offline') {
          const pay = await this.payments.createPaymentIntent({
            provider: input.paymentProvider as 'Stripe' | 'Razorpay',
            amount: pendingMatch.totalAmount,
            currency: pendingMatch.currency,
            reservationCode: pendingMatch.code,
            customer: {
              guestId: pendingMatch.guestId.toString(),
              email: input.guestDetails?.email,
              phoneNumber: input.guestDetails?.phoneNumber,
            },
            metadata: { reservationId: pendingMatch._id.toString() },
          })

          const updated = await this.repo.update(
            pendingMatch._id.toString(),
            {
              paymentProvider: pay.provider,
              paymentIntentId: pay.id,
              holdExpiresAt: dayjs().utc().add(30, 'minute').toDate(), // Extend hold
            } as any
          )

          paymentClientSecret = pay.clientSecret
          paymentOrder = pay.extra

          return Object.assign(updated!.toObject(), {
            paymentClientSecret,
            paymentOrder,
          })
        }
        
        // If for some reason no payment needed or provider missing, return existing
        return pendingMatch.toObject()
      }

      throw new CustomError(
        'Room not available for selected dates',
        HttpStatus.CONFLICT
      )
    }

    const quote = await this.quote({
      roomId: input.roomId,
      checkIn,
      checkOut,
      adults: input.adults,
      children: input.children,
      currency: input.currency,
    })

    const code = generateCode()
    const doc = await this.repo.create({
      code,
      guestId: guestId!,
      roomId: input.roomId,
      checkIn,
      checkOut,
      nights,
      adults: input.adults,
      children: input.children || 0,
      status: input.requiresPrepayment ? 'PendingPayment' : 'Confirmed',
      source: 'Online', // ✅ Always 'Online' for guest bookings
      notes: input.notes,
      currency: quote.currency,
      baseRate: quote.baseRate,
      taxes: quote.taxes,
      fees: quote.fees,
      totalAmount: quote.total,
      requiresPrepayment: !!input.requiresPrepayment,
      paymentProvider: input.paymentProvider,
      createdBy: null, // ✅ no staff user
      holdExpiresAt: input.requiresPrepayment
        ? dayjs().utc().add(30, 'minute').toDate()
        : undefined,
    } as any)

    // Payment (Stripe / Razorpay)
    let paymentClientSecret: string | undefined
    let paymentOrder: any | undefined
    if (input.requiresPrepayment && input.paymentProvider && input.paymentProvider !== 'Offline') {
      const pay = await this.payments.createPaymentIntent({
        provider: input.paymentProvider as 'Stripe' | 'Razorpay',
        amount: doc.totalAmount,
        currency: doc.currency,
        reservationCode: doc.code,
        customer: { 
          guestId: doc.guestId.toString(),
          email: input.guestDetails?.email,
          phoneNumber: input.guestDetails?.phoneNumber 
        },
        metadata: { reservationId: doc._id.toString() },
      })

      await this.repo.update(doc._id.toString(), {
        paymentProvider: pay.provider,
        paymentIntentId: pay.id,
      } as any)

      paymentClientSecret = pay.clientSecret
      paymentOrder = pay.extra
    }

    // Optionally fetch guest contact
    try {
      const contact = await this.guestRpc.getContactDetails(
        doc.guestId.toString()
      )
      if (contact) {
        await this.repo.update(doc._id.toString(), {
          guestContact: {
            email: contact.email,
            phoneNumber: contact.phoneNumber,
          },
        } as any)
        doc.guestContact = {
          email: contact.email,
          phoneNumber: contact.phoneNumber,
        } as any
      }
    } catch (err) {
      console.warn('Guest RPC failed', err)
    }

    // Publish event for Room Service, etc.
    const ch = await this.channelP
    const eventPayload = {
      event: 'reservation.created',
      data: {
        reservationId: doc._id.toString(),
        code: doc.code,
        guestId: doc.guestId,
        guestContact: doc.guestContact || null,
        roomId: doc.roomId,
        checkIn: doc.checkIn,
        checkOut: doc.checkOut,
        totalAmount: doc.totalAmount,
        currency: doc.currency,
      },
      createdAt: new Date().toISOString(),
    }
    ch.publish(
      'reservations.events',
      'reservation.created',
      Buffer.from(JSON.stringify(eventPayload)),
      { 
        persistent: true,
        headers: { correlationId: context.getStore()?.get('correlationId') }
      }
    )

    return Object.assign(doc.toObject(), { paymentClientSecret, paymentOrder })
  }

  getById(id: string) {
    return this.repo.findById(id)
  }

  getByCode(code: string) {
    return this.repo.findByCode(code)
  }

  async list(q: {
    page?: number
    limit?: number
    status?: string
    guestId?: string
    roomId?: string
    dateFrom?: Date
    dateTo?: Date
    search?: string
    sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
  }) {
    const page = q.page && q.page > 0 ? q.page : 1
    const limit = q.limit && q.limit > 0 ? q.limit : 20
    const skip = (page - 1) * limit

    const filter: any = {}
    if (q.status) filter.status = q.status
    if (q.guestId) filter.guestId = q.guestId
    if (q.roomId) filter.roomId = q.roomId
    if (q.dateFrom || q.dateTo) {
      filter.checkIn = {}
      if (q.dateFrom) filter.checkIn.$gte = q.dateFrom
      if (q.dateTo) filter.checkIn.$lte = q.dateTo
    }
    if (q.search) {
      const orConditions: any[] = [
        { code: { $regex: q.search, $options: 'i' } }
      ]

      try {
        // Find matching guests via RPC
        const guestIds = await this.guestRpc.searchGuests(q.search)
        if (guestIds.length > 0) {
          orConditions.push({ guestId: { $in: guestIds } })
        }
      } catch (err) {
        console.warn('Guest search RPC failed, falling back to code only', err)
      }

      filter.$or = orConditions
    }

    let sort: any = { createdAt: -1 }
    if (q.sort && q.sort.length > 0) {
      sort = {}
      q.sort.forEach((s) => {
        sort[s.column] = s.direction === 'asc' ? 1 : -1
      })
    }

    const [data, total] = await Promise.all([
      this.repo.findAll(filter, { skip, limit, sort }),
      this.repo.count(filter),
    ])

    // Enrich with room details
    try {
      const allRooms = await this.roomLookup.getAllRooms()
      const roomMap = new Map(allRooms.map((r: any) => [r.id.toString(), r]))

      const enrichedData = data.map((reservation) => {
        const rObj = reservation.toObject()
        const roomDetails = roomMap.get(rObj.roomId.toString())
        
        if (roomDetails) {
          // Attach the room object instead of just the ID
          rObj.roomId = {
            _id: roomDetails.id,
            number: roomDetails.number,
            type: roomDetails.type,
            // Add other fields if necessary
          } as any
        }
        return rObj
      })

      return { data: enrichedData, total, page, limit }
    } catch (err) {
      console.error('Failed to enrich reservations with room details', err)
      // Fallback to sending without room details if room service fails
      return { data, total, page, limit }
    }
  }

  async patch(id: string, payload: Partial<ReservationDocument>) {
    if (payload.checkIn || payload.checkOut) {
      // If dates change, validate overlap again
      const existing = await this.repo.findById(id)
      if (!existing)
        throw new CustomError('Reservation not found', HttpStatus.NOT_FOUND)

      const checkIn = payload.checkIn
        ? dayjs(payload.checkIn).startOf('day').toDate()
        : existing.checkIn
      const checkOut = payload.checkOut
        ? dayjs(payload.checkOut).startOf('day').toDate()
        : existing.checkOut
      if (!(checkIn < checkOut))
        throw new CustomError(
          'checkOut must be after checkIn',
          HttpStatus.BAD_REQUEST
        )

      const overlaps = await this.repo.findOverlaps({
        roomId: (payload.roomId as any) || existing.roomId.toString(),
        checkIn,
        checkOut,
        excludeId: id,
      })
      if (overlaps.length) {
        throw new CustomError(
          'Room not available for the new dates',
          HttpStatus.CONFLICT
        )
      }

      // re-quote if needed
      const roomId = (payload.roomId as any) || existing.roomId.toString()
      const q = await this.quote({
        roomId,
        checkIn,
        checkOut,
        adults: existing.adults,
        children: existing.children,
        currency: existing.currency,
      })
      payload.nights = this.diffNights(checkIn, checkOut)
      payload.baseRate = q.baseRate
      payload.taxes = q.taxes
      payload.fees = q.fees
      payload.totalAmount = q.total
      payload.checkIn = checkIn
      payload.checkOut = checkOut
    }

    const patched = await this.repo.update(id, payload)
    if (!patched)
      throw new CustomError('Reservation not found', HttpStatus.NOT_FOUND)
    return patched
  }

  // Status transitions with sanity checks
  async confirm(id: string) {
    const r = await this.repo.findById(id)
    if (!r) throw new CustomError('Reservation not found', HttpStatus.NOT_FOUND)
    if (r.status === 'Cancelled' || r.status === 'CheckedOut') {
      throw new CustomError(
        `Cannot confirm a ${r.status} reservation`,
        HttpStatus.BAD_REQUEST
      )
    }
    const updated = await this.repo.update(id, {
      status: 'Confirmed',
      holdExpiresAt: undefined,
      paymentCaptured: true,
    } as any)
    return updated!
  }

  async cancel(id: string, reason?: string) {
    const r = await this.repo.findById(id)
    if (!r) throw new CustomError('Reservation not found', HttpStatus.NOT_FOUND)
    if (r.status === 'CheckedOut') {
      throw new CustomError(
        'Cannot cancel a checked-out reservation',
        HttpStatus.BAD_REQUEST
      )
    }
    const updated = await this.repo.update(id, {
      status: 'Cancelled',
      cancelledAt: new Date(),
      notes: reason ? `${r.notes || ''}\n[cancel]: ${reason}`.trim() : r.notes,
    } as any)

    if (updated) {
      const ch = await this.channelP
      const eventPayload = {
        event: 'reservation.cancelled',
        data: {
          reservationId: updated._id.toString(),
          code: updated.code,
          guestId: updated.guestId,
          guestContact: updated.guestContact || null,
          roomId: updated.roomId,
          cancelledAt: updated.cancelledAt,
          reason,
        },
        createdAt: new Date().toISOString(),
      }
      ch.publish(
        'reservations.events',
        'reservation.cancelled',
        Buffer.from(JSON.stringify(eventPayload)),
        { 
          persistent: true,
          headers: { correlationId: context.getStore()?.get('correlationId') }
        }
      )
    }
    return updated!
  }

  async checkIn(id: string) {
    const r = await this.repo.findById(id)
    if (!r) throw new CustomError('Reservation not found', HttpStatus.NOT_FOUND)
    if (!['Confirmed'].includes(r.status)) {
      throw new CustomError(
        'Only confirmed reservations can be checked in',
        HttpStatus.BAD_REQUEST
      )
    }
    const updated = await this.repo.update(id, {
      status: 'CheckedIn',
      checkedInAt: new Date(),
    } as any)

    // Publish RabbitMQ event
    if (updated) {
      const ch = await this.channelP
      const eventPayload = {
        event: 'reservation.checkedIn',
        data: {
          reservationId: updated._id.toString(),
          code: updated.code,
          guestId: updated.guestId,
          roomId: updated.roomId,
          checkedInAt: updated.checkedInAt,
          occupied: true, // helps RoomService decide
        },
        createdAt: new Date().toISOString(),
      }
      ch.publish(
        'reservations.events',
        'reservation.checkedIn',
        Buffer.from(JSON.stringify(eventPayload)),
        { 
          persistent: true,
          headers: { correlationId: context.getStore()?.get('correlationId') }
        }
      )
    }
    return updated!
  }

  async checkOut(id: string) {
    const r = await this.repo.findById(id)
    if (!r) throw new CustomError('Reservation not found', HttpStatus.NOT_FOUND)
    if (!['CheckedIn'].includes(r.status)) {
      throw new CustomError(
        'Only checked-in reservations can be checked out',
        HttpStatus.BAD_REQUEST
      )
    }
    const updated = await this.repo.update(id, {
      status: 'CheckedOut',
      checkedOutAt: new Date(),
    } as any)

    // Update guest last visit
    this.guestRpc.updateGuestLastVisit(r.guestId.toString()).catch((err) => {
      console.warn('Failed to update guest last visit', err)
    })

    // Publish RabbitMQ event
    if (updated) {
      const ch = await this.channelP
      const eventPayload = {
        event: 'reservation.checkedOut',
        data: {
          reservationId: updated._id.toString(),
          code: updated.code,
          guestId: updated.guestId,
          roomId: updated.roomId,
          checkedOutAt: updated.checkedOutAt,
          occupied: false, // helps RoomService decide
        },
        createdAt: new Date().toISOString(),
      }
      ch.publish(
        'reservations.events',
        'reservation.checkedOut',
        Buffer.from(JSON.stringify(eventPayload)),
        { 
          persistent: true,
          headers: { correlationId: context.getStore()?.get('correlationId') }
        }
      )
    }
    return updated!
  }


  async checkAvailability(criteria: {
    checkIn: Date | string
    checkOut: Date | string
    adults?: number
    children?: number
    type?: string
  }): Promise<any[]> {
    const { checkIn, checkOut } = this.normalizeDates(criteria)

    if (!(checkIn < checkOut)) {
      throw new CustomError(
        'checkOut must be after checkIn',
        HttpStatus.BAD_REQUEST
      )
    }

    // 1. Fetch all rooms (candidates)
    const allRooms = await this.roomLookup.getAllRooms()
    console.log(`[CheckAvailability] Found ${allRooms.length} total rooms`)

    // 2. Find all reservations intersecting this date range
    // We want reservations where (res.checkIn < req.checkOut) AND (res.checkOut > req.checkIn)
    // and status is one of [PendingPayment, Confirmed, CheckedIn]
    const overlaps = await this.repo.findAll(
      {
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
        status: { $in: ['PendingPayment', 'Confirmed', 'CheckedIn'] },
      },
      { limit: 10000 } // Fetch plenty
    )
    console.log(`[CheckAvailability] Found ${overlaps.length} overlapping reservations`)

    const occupiedRoomIds = new Set(
      overlaps.map((r) => r.roomId.toString())
    )

    // 3. Filter rooms
    const availableRooms = allRooms.filter((room) => {
      // Must be generally available/active
      if (!room.available) return false
      // Must not be occupied
      if (occupiedRoomIds.has(room.id)) return false
      // Optional: Filter by type
      if (criteria.type && room.type !== criteria.type) return false
      return true
    })

    console.log(`[CheckAvailability] Returning ${availableRooms.length} available rooms`)
    return availableRooms
  }

  async lookupGuest(email?: string, phoneNumber?: string): Promise<any | null> {
    return this.guestRpc.lookupGuest(email, phoneNumber)
  }

  async getUserReservations(userId: string): Promise<ReservationDocument[]> {
    return this.repo.findAll({ createdBy: userId }, { sort: { createdAt: -1 } })
  }

  async publicLookup(code: string, contact: string): Promise<ReservationDocument | null> {
    const reservation = await this.repo.findByCode(code)
    if (!reservation) return null

    // Check against guestContact stored in reservation
    const guestContact = (reservation.guestContact as any) || {}
    const email = guestContact.email
    const phoneNumber = guestContact.phoneNumber
    
    const normalize = (s: string) => s?.trim().toLowerCase() || ''
    const contactNorm = normalize(contact)

    // Check matches
    const matchesEmail = email && normalize(email) === contactNorm
    const matchesPhone = phoneNumber && (contactNorm.includes(normalize(phoneNumber)) || normalize(phoneNumber).includes(contactNorm))

    if (matchesEmail || matchesPhone) {
      return reservation
    }
    
    // Security: Don't reveal mismatched contact
    return null
  }
}
