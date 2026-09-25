import { BillingRepository } from '../repository/implementation/billing.repository'
import { getGuestContact } from '../rpc/guest.rpc.client'

export async function backfillGuestContacts(repo: BillingRepository) {
  console.log('🔄 Backfill job started')
  const bills = await (
    await import('../models/billing.model')
  ).BillingModel.find({
    $or: [
      { 'guestContact.email': { $exists: false } },
      { 'guestContact.phoneNumber': { $exists: false } },
    ],
  }).limit(50) // batch

  for (const bill of bills) {
    try {
      const contact = await getGuestContact(bill.guestId)
      if (contact) {
        bill.guestContact = contact
        await bill.save()
        console.log(`✅ Patched guestContact for billing ${bill._id}`)
      }
    } catch (err) {
      console.error(`❌ Failed to patch billing ${bill._id}`, err)
    }
  }
}
