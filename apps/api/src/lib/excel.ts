import * as XLSX from "xlsx"

export interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; field: string; reason: string }>
}

const VALID_DOCUMENT_TYPES = ["DNI", "CUIT", "PASSPORT"]

export function exportToExcel(
  data: ExcelRow[],
  headers: string[],
  sheetName: string = "Data",
): Buffer {
  const ws = XLSX.utils.json_to_sheet(data, { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }))
}

export function parseExcel(buffer: Buffer): ExcelRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws)
}

export function validateCustomerRow(
  row: ExcelRow,
  index: number,
  existingEmails: Set<string>,
  existingDocs: Set<string>,
): Array<{ row: number; field: string; reason: string }> {
  const errors: Array<{ row: number; field: string; reason: string }> = []

  if (!row.name || String(row.name).trim().length === 0) {
    errors.push({ row: index, field: "name", reason: "Name is required" })
  }

  if (row.email && typeof row.email === "string") {
    const email = String(row.email).trim().toLowerCase()
    if (!email.includes("@")) {
      errors.push({ row: index, field: "email", reason: "Invalid email format" })
    } else if (existingEmails.has(email)) {
      errors.push({ row: index, field: "email", reason: "Duplicate email in file" })
    }
  }

  if (row.documentType && row.documentNumber) {
    const docType = String(row.documentType).trim().toUpperCase()
    if (!VALID_DOCUMENT_TYPES.includes(docType)) {
      errors.push({ row: index, field: "documentType", reason: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}` })
    } else if (existingDocs.has(`${docType}:${row.documentNumber}`)) {
      errors.push({ row: index, field: "documentNumber", reason: "Duplicate document in file" })
    }
  } else if (row.documentType || row.documentNumber) {
    errors.push({ row: index, field: "document", reason: "Both documentType and documentNumber are required together" })
  }

  return errors
}

export function validateSupplierRow(
  row: ExcelRow,
  index: number,
  existingEmails: Set<string>,
  existingDocs: Set<string>,
): Array<{ row: number; field: string; reason: string }> {
  const errors: Array<{ row: number; field: string; reason: string }> = []

  if (!row.name || String(row.name).trim().length === 0) {
    errors.push({ row: index, field: "name", reason: "Name is required" })
  }

  if (row.email && typeof row.email === "string") {
    const email = String(row.email).trim().toLowerCase()
    if (!email.includes("@")) {
      errors.push({ row: index, field: "email", reason: "Invalid email format" })
    } else if (existingEmails.has(email)) {
      errors.push({ row: index, field: "email", reason: "Duplicate email in file" })
    }
  }

  if (row.documentType && row.documentNumber) {
    const docType = String(row.documentType).trim().toUpperCase()
    if (!VALID_DOCUMENT_TYPES.includes(docType)) {
      errors.push({ row: index, field: "documentType", reason: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}` })
    } else if (existingDocs.has(`${docType}:${row.documentNumber}`)) {
      errors.push({ row: index, field: "documentNumber", reason: "Duplicate document in file" })
    }
  } else if (row.documentType || row.documentNumber) {
    errors.push({ row: index, field: "document", reason: "Both documentType and documentNumber are required together" })
  }

  return errors
}
