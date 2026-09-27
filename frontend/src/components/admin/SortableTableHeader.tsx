import React from 'react'
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'

export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

interface SortableTableHeaderProps {
  column: string
  label: string
  sortConfigs: SortConfig[]
  onSort: (column: string, shiftKey: boolean) => void
  className?: string
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  column,
  label,
  sortConfigs,
  onSort,
  className = ''
}) => {
  const sortIndex = sortConfigs.findIndex(s => s.column === column)
  const sortConfig = sortConfigs[sortIndex]
  
  return (
    <th 
      onClick={(e) => onSort(column, e.shiftKey)}
      className={`cursor-pointer hover:bg-gray-100 select-none transition-colors group ${className}`}
      title="Click to sort, Shift+Click for multi-sort"
    >
      <div className="flex items-center gap-2">
        {label}
        <div className="flex items-center text-gray-400 group-hover:text-gray-600">
          {sortConfig ? (
            <div className="flex items-center">
              {sortConfig.direction === 'asc' ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
              {sortConfigs.length > 1 && (
                <span className="ml-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full w-4 h-4 flex items-center justify-center">
                  {sortIndex + 1}
                </span>
              )}
            </div>
          ) : (
            <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />
          )}
        </div>
      </div>
    </th>
  )
}

export default SortableTableHeader
