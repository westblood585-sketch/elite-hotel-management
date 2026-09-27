import { useOutletContext } from 'react-router-dom'

// Custom hook to use the outlet context
interface MainLayoutContext {
  addToRefs: (el: HTMLDivElement | null) => void
}

export const useMainLayoutContext = () => {
  return useOutletContext<MainLayoutContext>()
}
