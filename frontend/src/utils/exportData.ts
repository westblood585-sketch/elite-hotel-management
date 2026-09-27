import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}.csv`)
}

/**
 * Export data to Excel format (.xlsx)
 */
export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${filename}.xlsx`)
}

/**
 * Format data for export by selecting specific columns and cleaning values
 */
export const formatDataForExport = <T extends Record<string, any>>(
  data: T[],
  columnMapping: Record<string, string | ((item: T) => any)>
): any[] => {
  return data.map((item) => {
    const formatted: any = {}
    
    Object.entries(columnMapping).forEach(([displayName, accessor]) => {
      if (typeof accessor === 'function') {
        formatted[displayName] = accessor(item)
      } else {
        // Handle nested properties (e.g., 'user.email')
        const value = accessor.split('.').reduce((obj, key) => obj?.[key], item)
        formatted[displayName] = value ?? ''
      }
    })
    
    return formatted
  })
}

/**
 * Generate filename with current date
 */
export const generateFilename = (prefix: string): string => {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}-${date}`
}
