import PDFDocument from "pdfkit"

// ── Data interfaces ──────────────────────────────────────────

export interface PdfItem {
  product: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface PdfPayment {
  method: string
  amount: number
  date: string
}

export interface PdfDocData {
  title: string
  number: string
  date: string
  customerName: string
  customerDoc?: string
  customerAddress?: string
  customerEmail?: string
  items: PdfItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  status: string
  payments?: PdfPayment[]
  paidAmount?: number
}

// ── Helpers ──────────────────────────────────────────────────

const CURRENCY = Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
})

function fmt(n: number): string {
  return CURRENCY.format(n)
}

const COLUMNS = {
  left: 50,
  right: 545,
  tableLeft: 50,
  tableRight: 545,
  tableWidth: 495,
}

const COLORS = {
  primary: "#1e40af",   // blue-800
  text: "#1f2937",      // gray-800
  muted: "#6b7280",     // gray-500
  border: "#d1d5db",    // gray-300
  background: "#f3f4f6",// gray-100
}

// ── Drawing helpers ──────────────────────────────────────────

function drawHeader(doc: typeof PDFDocument.prototype) {
  doc.fontSize(22).font("Helvetica-Bold").fillColor(COLORS.primary).text("CrmErp", COLUMNS.left, 40)

  doc.fontSize(8).font("Helvetica").fillColor(COLORS.muted)
    .text("Generado el " + new Date().toLocaleDateString("es-AR"), COLUMNS.left, 68)
}

function drawLine(doc: typeof PDFDocument.prototype, y: number) {
  doc.strokeColor(COLORS.border).lineWidth(1).moveTo(COLUMNS.left, y).lineTo(COLUMNS.right, y).stroke()
}

function drawSectionTitle(doc: typeof PDFDocument.prototype, title: string, y: number): number {
  doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.text).text(title, COLUMNS.left, y)
  return y + 18
}

function drawDocMeta(doc: typeof PDFDocument.prototype, data: PdfDocData, startY: number): number {
  let y = startY

  doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.text)
    .text(data.title, COLUMNS.left, y)
  y += 26

  // Number + status + date on one line
  doc.fontSize(10).font("Helvetica")
  doc.fillColor(COLORS.text).text(`N.º ${data.number}`, COLUMNS.left, y, { continued: true })
  doc.fillColor(COLORS.muted).text(`  ·  `, { continued: true })
  doc.fillColor(COLORS.text).text(data.date)

  // Status badge text
  const statusColors: Record<string, string> = {
    DRAFT: "#92400e",
    SENT: "#1e40af",
    ACCEPTED: "#166534",
    REJECTED: "#991b1b",
    PAID: "#166534",
    CANCELLED: "#991b1b",
  }
  const statusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    PAID: "Pagado",
    CANCELLED: "Cancelado",
  }
  doc.fontSize(9).font("Helvetica-Bold")
    .fillColor(statusColors[data.status] ?? COLORS.muted)
    .text((statusLabels[data.status] ?? data.status).toUpperCase(), COLUMNS.right, y, { align: "right" })

  y += 22
  drawLine(doc, y)
  return y + 14
}

function drawCustomerInfo(doc: typeof PDFDocument.prototype, data: PdfDocData, startY: number): number {
  let y = drawSectionTitle(doc, "Cliente", startY)

  doc.fontSize(10).font("Helvetica").fillColor(COLORS.text)
  doc.text(data.customerName, COLUMNS.left, y)

  if (data.customerDoc) {
    doc.fontSize(9).fillColor(COLORS.muted).text(`Doc: ${data.customerDoc}`, COLUMNS.left, y + 14)
  }

  if (data.customerEmail) {
    doc.fontSize(9).fillColor(COLORS.muted).text(data.customerEmail, COLUMNS.left, data.customerDoc ? y + 28 : y + 14)
  }

  if (data.customerAddress) {
    const addrY = data.customerEmail ? y + 42 : data.customerDoc ? y + 28 : y + 14
    doc.fontSize(9).fillColor(COLORS.muted).text(data.customerAddress, COLUMNS.left, addrY)
  }

  const bottomY = data.customerAddress
    ? (data.customerEmail ? y + 56 : data.customerDoc ? y + 42 : y + 28)
    : data.customerEmail
      ? y + 28
      : data.customerDoc
        ? y + 28
        : y + 14

  return Math.max(bottomY, y + 28)
}

function drawItemsTable(doc: typeof PDFDocument.prototype, items: PdfItem[], startY: number): number {
  let y = drawSectionTitle(doc, "Detalle", startY)

  // Table header
  const headerY = y
  const colWidths = [235, 60, 100, 100] // product, qty, unit price, subtotal
  const colStarts = [COLUMNS.tableLeft]
  for (let i = 1; i < colWidths.length; i++) {
    colStarts.push(colStarts[i - 1] + colWidths[i - 1])
  }
  const rowH = 20

  doc.rect(COLUMNS.tableLeft, headerY, COLUMNS.tableWidth, rowH).fill(COLORS.background)
  doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.muted)
  doc.text("Producto", colStarts[0] + 6, headerY + 6)
  doc.text("Cant.", colStarts[1] + 6, headerY + 6, { width: colWidths[1] - 12, align: "right" })
  doc.text("P. Unitario", colStarts[2] + 6, headerY + 6, { width: colWidths[2] - 12, align: "right" })
  doc.text("Subtotal", colStarts[3] + 6, headerY + 6, { width: colWidths[3] - 12, align: "right" })

  y = headerY + rowH

  // Table rows
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text)
  for (const item of items) {
    // Check page break
    if (y + rowH > 740) {
      doc.addPage()
      y = 40
      // Redraw header on new page
      doc.rect(COLUMNS.tableLeft, y, COLUMNS.tableWidth, rowH).fill(COLORS.background)
      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.muted)
      doc.text("Producto", colStarts[0] + 6, y + 6)
      doc.text("Cant.", colStarts[1] + 6, y + 6, { width: colWidths[1] - 12, align: "right" })
      doc.text("P. Unitario", colStarts[2] + 6, y + 6, { width: colWidths[2] - 12, align: "right" })
      doc.text("Subtotal", colStarts[3] + 6, y + 6, { width: colWidths[3] - 12, align: "right" })
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.text)
      y += rowH
    }

    // Alternating row background
    const idx = items.indexOf(item)
    if (idx % 2 === 1) {
      doc.rect(COLUMNS.tableLeft, y, COLUMNS.tableWidth, rowH).fill(COLORS.background)
    }

    doc.fillColor(COLORS.text)
    doc.text(item.product, colStarts[0] + 6, y + 5, { width: colWidths[0] - 12 })
    doc.text(String(item.quantity), colStarts[1] + 6, y + 5, { width: colWidths[1] - 12, align: "right" })
    doc.text(fmt(item.unitPrice), colStarts[2] + 6, y + 5, { width: colWidths[2] - 12, align: "right" })
    doc.text(fmt(item.subtotal), colStarts[3] + 6, y + 5, { width: colWidths[3] - 12, align: "right" })

    // Bottom border
    doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(COLUMNS.tableLeft, y + rowH).lineTo(COLUMNS.tableRight, y + rowH).stroke()

    y += rowH
  }

  return y + 10
}

function drawTotals(doc: typeof PDFDocument.prototype, data: PdfDocData, startY: number): number {
  let y = startY

  // Check page break
  if (y + 100 > 740) {
    doc.addPage()
    y = 40
  }

  const totalsLeft = 345
  const labelX = totalsLeft
  const valueX = COLUMNS.right

  doc.fontSize(10).font("Helvetica")
  doc.fillColor(COLORS.muted).text("Subtotal", labelX, y)
  doc.fillColor(COLORS.text).text(fmt(data.subtotal), valueX, y, { align: "right" })
  y += 18

  doc.fillColor(COLORS.muted).text("IVA (21%)", labelX, y)
  doc.fillColor(COLORS.text).text(fmt(data.tax), valueX, y, { align: "right" })
  y += 18

  drawLine(doc, y)
  y += 8

  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.text)
  doc.text("Total", labelX, y)
  doc.text(fmt(data.total), valueX, y, { align: "right" })
  y += 24

  // Paid amount if applicable
  if (data.paidAmount !== undefined && data.paidAmount > 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#166534")
    doc.text("Pagado", labelX, y)
    doc.text(fmt(data.paidAmount), valueX, y, { align: "right" })
    y += 18

    const remaining = data.total - data.paidAmount
    if (remaining > 0) {
      doc.fillColor("#991b1b")
      doc.text("Pendiente", labelX, y)
      doc.text(fmt(remaining), valueX, y, { align: "right" })
      y += 18
    } else {
      doc.fillColor("#166534")
      doc.text("Saldo", labelX, y)
      doc.text(fmt(remaining), valueX, y, { align: "right" })
      y += 18
    }
  }

  return y
}

function drawPaymentsTable(doc: typeof PDFDocument.prototype, payments: PdfPayment[], startY: number): number {
  let y = drawSectionTitle(doc, "Pagos", startY)

  if (payments.length === 0) {
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted)
      .text("No hay pagos registrados", COLUMNS.left, y)
    return y + 18
  }

  const colWidths = [165, 165, 165]
  const colStarts = [COLUMNS.tableLeft, COLUMNS.tableLeft + 165, COLUMNS.tableLeft + 330]
  const rowH = 20

  // Header
  doc.rect(COLUMNS.tableLeft, y, COLUMNS.tableWidth, rowH).fill(COLORS.background)
  doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.muted)
  doc.text("Método", colStarts[0] + 6, y + 6)
  doc.text("Monto", colStarts[1] + 6, y + 6, { width: colWidths[1] - 12, align: "right" })
  doc.text("Fecha", colStarts[2] + 6, y + 6, { width: colWidths[2] - 12, align: "right" })
  y += rowH

  const methodLabels: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
    check: "Cheque",
  }

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text)
  for (const p of payments) {
    if (y + rowH > 740) {
      doc.addPage()
      y = 40
    }

    const idx = payments.indexOf(p)
    if (idx % 2 === 1) {
      doc.rect(COLUMNS.tableLeft, y, COLUMNS.tableWidth, rowH).fill(COLORS.background)
    }

    doc.fillColor(COLORS.text)
    doc.text(methodLabels[p.method] ?? p.method, colStarts[0] + 6, y + 5)
    doc.text(fmt(p.amount), colStarts[1] + 6, y + 5, { width: colWidths[1] - 12, align: "right" })
    doc.text(p.date, colStarts[2] + 6, y + 5, { width: colWidths[2] - 12, align: "right" })

    doc.strokeColor(COLORS.border).lineWidth(0.5)
      .moveTo(COLUMNS.tableLeft, y + rowH).lineTo(COLUMNS.tableRight, y + rowH).stroke()

    y += rowH
  }

  return y + 10
}

function drawNotes(doc: typeof PDFDocument.prototype, notes: string, startY: number): number {
  if (!notes) return startY

  let y = drawSectionTitle(doc, "Notas", startY)

  if (y + 40 > 740) {
    doc.addPage()
    y = 40
  }

  doc.fontSize(9).font("Helvetica").fillColor(COLORS.text)
  doc.text(notes, COLUMNS.left, y, { width: COLUMNS.tableWidth })
  return y + 18 + doc.heightOfString(notes, { width: COLUMNS.tableWidth })
}

function drawFooter(doc: typeof PDFDocument.prototype) {
  // Page numbers are handled by PDFKit's built-in page tracking
  // We add a simple footer on each page
  const pages = doc.bufferedPageRange()
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i)
    const isFirst = i === 0
    if (isFirst) continue // skip first page, we have the header there

    doc.fontSize(7).font("Helvetica").fillColor(COLORS.muted)
    doc.text(
      `CrmErp  ·  Página ${i + 1}`,
      COLUMNS.left,
      780,
      { width: COLUMNS.tableWidth, align: "center" },
    )
  }
}

// ── Public generators ───────────────────────────────────────

function buildPdf(data: PdfDocData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // ── First page ─────────────────────────────────────────
    drawHeader(doc)

    let y = 100
    y = drawDocMeta(doc, data, y)
    y = drawCustomerInfo(doc, data, y)
    y = drawItemsTable(doc, data.items, y)
    y = drawTotals(doc, data, y)

    if (data.notes) {
      y = drawNotes(doc, data.notes, y)
    }

    // Payments section (only for invoices)
    if (data.payments && data.title.toLowerCase().includes("factura")) {
      y = drawPaymentsTable(doc, data.payments, y)
    }

    drawFooter(doc)
    doc.end()
  })
}

export function generateQuotePdf(data: PdfDocData): Promise<Buffer> {
  return buildPdf({ ...data, title: "Cotización", payments: undefined, paidAmount: undefined })
}

export function generateOrderPdf(data: PdfDocData): Promise<Buffer> {
  return buildPdf({ ...data, title: "Pedido", payments: undefined, paidAmount: undefined })
}

export function generateInvoicePdf(data: PdfDocData): Promise<Buffer> {
  return buildPdf(data)
}
