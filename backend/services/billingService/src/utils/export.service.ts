// src/utils/export.service.ts
import { BillingDoc } from '../models/billing.model'
import { PDFService } from './pdf.service'
import archiver from 'archiver'
import { Readable } from 'stream'

export class ExportService {
  /**
   * Export billings to CSV format
   * @param billings - Array of billing documents
   * @returns CSV string
   */
  static exportToCSV(billings: BillingDoc[]): string {
    const headers = [
      'Invoice ID',
      'Payment ID',
      'Reservation ID',
      'Guest ID',
      'Guest Email',
      'Amount',
      'Currency',
      'Status',
      'Created Date',
      'Updated Date',
      'Archived',
    ]

    const rows = billings.map((billing) => [
      billing._id.toString(),
      billing.paymentId,
      billing.reservationId,
      billing.guestId,
      billing.guestContact?.email || '',
      billing.amount.toString(),
      billing.currency.toUpperCase(),
      billing.status,
      new Date(billing.createdAt).toISOString(),
      new Date(billing.updatedAt).toISOString(),
      billing.archived ? 'Yes' : 'No',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return csvContent
  }

  /**
   * Export ledger entries to CSV format
   * @param billing - Billing document
   * @returns CSV string
   */
  static exportLedgerToCSV(billing: BillingDoc): string {
    const headers = ['Date', 'Type', 'Amount', 'Note']

    const rows = billing.ledger.map((entry) => [
      new Date(entry.createdAt).toISOString(),
      entry.type,
      entry.amount.toString(),
      entry.note || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return csvContent
  }

  /**
   * Create a ZIP archive with multiple PDF invoices
   * @param billings - Array of billing documents
   * @returns ZIP archive buffer
   */
  static async exportToPDFBatch(billings: BillingDoc[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const archive = archiver('zip', { zlib: { level: 9 } })
        const buffers: Buffer[] = []

        archive.on('data', (chunk) => buffers.push(chunk))
        archive.on('end', () => resolve(Buffer.concat(buffers)))
        archive.on('error', reject)

        // Generate PDF for each billing and add to archive
        for (const billing of billings) {
          try {
            const pdfBuffer = await PDFService.generateInvoice(billing)
            const filename = `invoice_${billing._id.toString().slice(-8).toUpperCase()}.pdf`
            archive.append(pdfBuffer, { name: filename })
          } catch (error) {
            console.error(`Failed to generate PDF for billing ${billing._id}:`, error)
          }
        }

        archive.finalize()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Create readable stream from string content
   * @param content - String content
   * @returns Readable stream
   */
  static stringToStream(content: string): Readable {
    const stream = new Readable()
    stream.push(content)
    stream.push(null)
    return stream
  }
}
