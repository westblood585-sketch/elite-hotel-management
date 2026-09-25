// src/utils/pdf.service.ts
import PDFDocument from 'pdfkit'
import { BillingDoc } from '../models/billing.model'

export class PDFService {
  /**
   * Generate a professional PDF invoice
   * @param billing - Billing document
   * @returns PDF Buffer
   */
  static async generateInvoice(billing: BillingDoc): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' })
        const buffers: Buffer[] = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => resolve(Buffer.concat(buffers)))
        doc.on('error', reject)

        // Colors
        const primaryColor = '#1a237e' // Deep Blue
        const accentColor = '#C5A059' // Gold
        const grayColor = '#6b7280'
        const lightGray = '#f3f4f6'

        // --- Header Section ---
        
        // Logo Placeholder (Text based for now, but styled)
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('ELITE', 50, 45, { continued: true })
          .fillColor(accentColor)
          .text(' HOTEL')
          .fontSize(10)
          .font('Helvetica')
          .fillColor(grayColor)
          .text('Luxury Accommodation & Services', 50, 75)
          .moveDown(0.5)

        // Company Info (Right aligned)
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#333')
          .text('123 Luxury Avenue', 350, 50, { align: 'right' })
          .text('Elite City, EC 12345', 350, 65, { align: 'right' })
          .text('+1 (555) 123-4567', 350, 80, { align: 'right' })
          .text('billing@elitehotel.com', 350, 95, { align: 'right' })

        // Divider
        doc
          .moveTo(50, 120)
          .lineTo(545, 120)
          .strokeColor(lightGray)
          .lineWidth(1)
          .stroke()

        // --- Invoice Details Section ---
        
        const invoiceTop = 140
        
        // Title
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('INVOICE', 50, invoiceTop)

        // Invoice Meta Data (Right side)
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#333')
          .text('Invoice #:', 350, invoiceTop)
          .font('Helvetica')
          .text(billing._id.toString().slice(-8).toUpperCase(), 430, invoiceTop, { align: 'right' })
          
          .font('Helvetica-Bold')
          .text('Date:', 350, invoiceTop + 15)
          .font('Helvetica')
          .text(new Date(billing.createdAt).toLocaleDateString(), 430, invoiceTop + 15, { align: 'right' })
          
          .font('Helvetica-Bold')
          .text('Status:', 350, invoiceTop + 30)
          .fillColor(this.getStatusColor(billing.status))
          .font('Helvetica-Bold')
          .text(billing.status.toUpperCase(), 430, invoiceTop + 30, { align: 'right' })

        // Bill To Section
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('Bill To:', 50, invoiceTop + 40)
          .moveDown(0.5)
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#333')
          .text(billing.guestContact?.email || 'Guest')
        
        if (billing.guestContact?.phoneNumber) {
          doc.text(billing.guestContact.phoneNumber)
        }
        
        doc.moveDown(0.5)
        doc.font('Helvetica-Bold').text('Guest ID: ', { continued: true }).font('Helvetica').text(billing.guestId)
        doc.font('Helvetica-Bold').text('Reservation: ', { continued: true }).font('Helvetica').text(billing.reservationId)

        // --- Table Section ---
        
        const tableTop = 250
        const itemHeight = 30
        const leftColumn = 50
        
        // Table Header Background
        doc
          .rect(leftColumn, tableTop, 495, 25)
          .fill(primaryColor)
        
        // Table Headers
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#fff')
          .text('Date', leftColumn + 10, tableTop + 8)
          .text('Description', leftColumn + 100, tableTop + 8)
          .text('Type', leftColumn + 320, tableTop + 8)
          .text('Amount', leftColumn + 400, tableTop + 8, { width: 85, align: 'right' })

        // Table Rows
        let yPosition = tableTop + 25
        doc.font('Helvetica').fontSize(9).fillColor('#333')

        billing.ledger.forEach((entry, index) => {
          // Row Background (Zebra Striping)
          if (index % 2 === 0) {
            doc
              .rect(leftColumn, yPosition, 495, itemHeight)
              .fill(lightGray)
          }

          doc.fillColor('#333')
          
          // Date
          doc.text(
            new Date(entry.createdAt).toLocaleDateString(),
            leftColumn + 10,
            yPosition + 10
          )
          
          // Description
          doc.text(
            entry.note || entry.type, 
            leftColumn + 100, 
            yPosition + 10, 
            { width: 200, height: itemHeight - 10, ellipsis: true }
          )
          
          // Type
          doc.text(
            entry.type.toUpperCase(), 
            leftColumn + 320, 
            yPosition + 10
          )
          
          // Amount
          const isNegative = entry.amount < 0
          doc
            .font(isNegative ? 'Helvetica' : 'Helvetica-Bold')
            .fillColor(isNegative ? '#ef4444' : '#333') // Red for negative
            .text(
              `${entry.amount >= 0 ? '+' : ''}${entry.amount.toFixed(2)}`,
              leftColumn + 400,
              yPosition + 10,
              { width: 85, align: 'right' }
            )

          yPosition += itemHeight
          
          // Add new page if table gets too long
          if (yPosition > 700) {
            doc.addPage()
            yPosition = 50
          }
        })

        // --- Summary Section ---
        
        yPosition += 20
        const summaryX = 350
        
        // Divider line
        doc
          .moveTo(summaryX, yPosition)
          .lineTo(545, yPosition)
          .strokeColor(primaryColor)
          .lineWidth(1)
          .stroke()
          
        yPosition += 15

        // Total Amount
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('Total Amount:', summaryX, yPosition)
          .fontSize(14)
          .text(
            `${billing.amount.toFixed(2)} ${billing.currency.toUpperCase()}`,
            summaryX + 100,
            yPosition - 2,
            { align: 'right', width: 95 }
          )

        // --- Footer Section ---
        
        const bottomPosition = 730
        
        doc
          .moveTo(50, bottomPosition)
          .lineTo(545, bottomPosition)
          .strokeColor(lightGray)
          .lineWidth(1)
          .stroke()
          
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(grayColor)
          .text(
            'Thank you for choosing Elite Hotel. We hope you enjoyed your stay.',
            50,
            bottomPosition + 15,
            { align: 'center', width: 495 }
          )
          .moveDown(0.5)
          .text(
            'Please make checks payable to "Elite Hotel". Payment is due within 30 days.',
            { align: 'center' }
          )
          .moveDown(0.5)
          .text(`Payment Reference: ${billing.paymentId}`, { align: 'center' })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  private static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      paid: '#10b981',      // Green
      pending: '#f59e0b',   // Amber
      refunded: '#3b82f6',  // Blue
      failed: '#ef4444',    // Red
      void: '#6b7280',      // Gray
      archived: '#9ca3af',  // Light Gray
    }
    return colors[status] || '#000000'
  }
}
