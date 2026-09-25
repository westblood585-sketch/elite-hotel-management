// src/interfaces/IGuest.ts
export default interface IGuest {
  firstName: string
  lastName?: string
  email?: string
  phoneNumber: string
  dateOfBirth?: Date
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  idProof?: {
    type?: 'Passport' | 'NationalID' | 'DrivingLicense' | 'Other'
    number?: string
    image?: { publicId?: string; url?: string } | null
  } | null
  preferences?: {
    smoking?: boolean
    roomType?: 'Standard' | 'Deluxe' | 'Premium' | 'Luxury'
    bedType?: 'Single' | 'Double' | 'Queen' | 'King'
    notes?: string
  }
  notes?: string
  isBlacklisted?: boolean
  status?: 'Standard' | 'VIP' | 'Loyalty'
  isIdVerified?: boolean
  lastVisit?: Date
  createdAt?: Date
  updatedAt?: Date
}
