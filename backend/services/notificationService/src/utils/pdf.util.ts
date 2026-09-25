import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export async function generateInvoicePdf(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const buffers: any[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        resolve(Buffer.concat(buffers))
      })

      // Header
      doc.fontSize(20).text('Hotel Invoice', { align: 'center' })
      doc.moveDown()

      // Guest info
      doc
        .fontSize(12)
        .text(`Guest: ${data.guestContact?.email || 'N/A'}`)
        .text(`Reservation ID: ${data.reservationId}`)
        .text(`Date: ${new Date().toLocaleDateString()}`)
        .moveDown()

      // Invoice details
      doc
        .text(`Amount: ${data.amount} ${data.currency}`)
        .text(`Status: ${data.status || 'Pending'}`)
        .moveDown()

      if (data.note) doc.text(`Note: ${data.note}`)

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
