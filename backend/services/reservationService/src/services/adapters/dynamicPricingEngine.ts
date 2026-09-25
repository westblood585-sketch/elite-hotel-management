import {
  IPricingEngine,
  PricingInput,
  PricingQuote,
} from '../interface/IPricingEngine'

export class DynamicPricingEngine implements IPricingEngine {
  async calculate(input: PricingInput): Promise<PricingQuote> {
    const { checkIn, checkOut, baseRate, currency = 'INR', promoCode } = input

    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Base price
    let subtotal = baseRate * nights
    let discountApplied = 0

    // ---------- 1. Seasonal Pricing ----------
    const month = checkIn.getMonth() + 1
    let seasonalMultiplier = 1

    // Example: High season (Nov–Feb) increases by 25%
    if ([11, 12, 1, 2].includes(month)) seasonalMultiplier = 1.25
    // Low season (May–July) discount 15%
    else if ([5, 6, 7].includes(month)) seasonalMultiplier = 0.85

    subtotal *= seasonalMultiplier

    // ---------- 2. Occupancy Rate Adjustment ----------
    // In real app, you'd fetch this from RoomService
    const occupancyRate = await this.getOccupancyRate(input.roomId)
    let occupancyMultiplier = 1

    if (occupancyRate > 80) occupancyMultiplier = 1.3 // high demand
    else if (occupancyRate < 40) occupancyMultiplier = 0.9 // low demand

    subtotal *= occupancyMultiplier

    // ---------- 3. Promo Code ----------
    if (promoCode === 'WINTER20') {
      const promoDiscount = subtotal * 0.2
      discountApplied += promoDiscount
      subtotal -= promoDiscount
    }

    // ---------- 4. Taxes & Fees ----------
    const taxes = Math.round(subtotal * 0.12)
    const fees = Math.round(subtotal * 0.02)
    const total = subtotal + taxes + fees

    const breakdown = [
      { label: `Base Rate (${nights} nights x ${currency} ${baseRate})`, amount: subtotal + discountApplied }, // Original subtotal before discount
    ]

    if (discountApplied > 0) {
      breakdown.push({ label: 'Discount', amount: -discountApplied })
    }

    breakdown.push({ label: 'Taxes (12%)', amount: taxes })
    breakdown.push({ label: 'Fees (2%)', amount: fees })

    // Optional: seasonal adjustment note or line item if needed, but for now just basic components

    return {
      baseRate,
      nights,
      subtotal,
      taxes,
      fees,
      total,
      currency,
      discountApplied,
      breakdown,
      notes: `Seasonal multiplier: ${seasonalMultiplier}, Occupancy: ${occupancyRate}%, Demand: ${occupancyMultiplier}`,
    }
  }

  // Simulate occupancy rate fetch
  private async getOccupancyRate(roomId: string): Promise<number> {
    // later can integrate with RoomService / analytics microservice
    // mock random data for now
    return Math.floor(Math.random() * 100)
  }
}
