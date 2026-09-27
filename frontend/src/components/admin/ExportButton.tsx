import React, { useState } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'

export type ExportFormat = 'csv' | 'excel'
export type ExportScope = 'current' | 'filtered' | 'all'

interface ExportButtonProps {
  onExport: (format: ExportFormat, scope: ExportScope) => Promise<void>
  loading?: boolean
  disabled?: boolean
  showScopeOptions?: boolean
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  loading = false,
  disabled = false,
  showScopeOptions = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: ExportFormat, scope: ExportScope) => {
    setExporting(true)
    setIsOpen(false)
    try {
      await onExport(format, scope)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading || exporting}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download size={20} />
        <span>{exporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Export Format
              </div>
              
              {/* CSV Options */}
              <div className="mb-2">
                <div className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700">
                  <FileText size={16} className="text-green-600" />
                  <span className="font-medium">CSV</span>
                </div>
                <button
                  onClick={() => handleExport('csv', 'current')}
                  className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  Current Page
                </button>
                {showScopeOptions && (
                  <>
                    <button
                      onClick={() => handleExport('csv', 'filtered')}
                      className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      All Filtered Results
                    </button>
                    <button
                      onClick={() => handleExport('csv', 'all')}
                      className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      All Data
                    </button>
                  </>
                )}
              </div>

              <div className="border-t border-gray-100 my-2" />

              {/* Excel Options */}
              <div>
                <div className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700">
                  <FileSpreadsheet size={16} className="text-blue-600" />
                  <span className="font-medium">Excel</span>
                </div>
                <button
                  onClick={() => handleExport('excel', 'current')}
                  className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  Current Page
                </button>
                {showScopeOptions && (
                  <>
                    <button
                      onClick={() => handleExport('excel', 'filtered')}
                      className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      All Filtered Results
                    </button>
                    <button
                      onClick={() => handleExport('excel', 'all')}
                      className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      All Data
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
