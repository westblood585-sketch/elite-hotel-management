export interface IPricingEngine {
  calculate(input: PricingInput): Promise<PricingQuote>
}

export interface PricingInput {
  roomId: string
  checkIn: Date
  checkOut: Date
  baseRate: number
  currency?: string
  guestType?: 'regular' | 'vip' | 'corporate'
  promoCode?: string
}

export interface PricingQuote {
  baseRate: number
  nights: number
  subtotal: number
  taxes: number
  fees: number
  total: number
  currency: string
  discountApplied?: number
  breakdown?: {
    label: string
    amount: number
  }[]
  notes?: string
}
