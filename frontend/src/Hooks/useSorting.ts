import { useState, useEffect, useCallback } from 'react'

export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

export const useSorting = (initialSort: SortConfig[] = [], persistenceKey?: string) => {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>(initialSort)

  // Load from localStorage on mount if persistenceKey is provided
  useEffect(() => {
    if (persistenceKey) {
      const saved = localStorage.getItem(`sort-${persistenceKey}`)
      if (saved) {
        try {
          setSortConfigs(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse saved sort config', e)
        }
      }
    }
  }, [persistenceKey])

  // Save to localStorage whenever sortConfigs changes
  useEffect(() => {
    if (persistenceKey) {
      localStorage.setItem(`sort-${persistenceKey}`, JSON.stringify(sortConfigs))
    }
  }, [sortConfigs, persistenceKey])

  const handleSort = useCallback((column: string, shiftKey: boolean) => {
    setSortConfigs(prev => {
      let newConfigs = [...prev]
      const existingIndex = newConfigs.findIndex(s => s.column === column)

      if (shiftKey) {
        // Multi-column sort
        if (existingIndex >= 0) {
          // Toggle direction or remove if it's the 3rd state (optional, but let's just toggle for now)
          if (newConfigs[existingIndex].direction === 'asc') {
            newConfigs[existingIndex].direction = 'desc'
          } else {
            // Remove from sort if it was desc (3-state toggle: asc -> desc -> none)
            newConfigs.splice(existingIndex, 1)
          }
        } else {
          // Add new sort column
          newConfigs.push({ column, direction: 'asc' })
        }
      } else {
        // Single column sort
        if (existingIndex >= 0 && newConfigs.length === 1) {
          // Toggle direction
          newConfigs[0].direction = newConfigs[0].direction === 'asc' ? 'desc' : 'asc'
        } else {
          // Replace with new single sort
          newConfigs = [{ column, direction: 'asc' }]
        }
      }
      return newConfigs
    })
  }, [])

  const clearSort = useCallback(() => {
    setSortConfigs([])
  }, [])

  return {
    sortConfigs,
    handleSort,
    clearSort
  }
}
