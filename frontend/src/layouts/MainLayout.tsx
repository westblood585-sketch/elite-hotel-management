import React, { useEffect, useRef, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header/Header'
import Footer from '../components/layout/Footer/Footer'

interface MainLayoutContext {
  addToRefs: (el: HTMLDivElement | null) => void
}

interface MainLayoutProps {
  enableSnapScrolling?: boolean
}

const MainLayout: React.FC<MainLayoutProps> = ({
  enableSnapScrolling = false,
}) => {
  const sections = useRef<HTMLElement[]>([])
  const isScrollingRef = useRef(false)

  const handleScroll = useCallback(
    (event: WheelEvent) => {
      if (!enableSnapScrolling) return

      // Allow normal scrolling on smaller screens
      if (window.innerWidth < 1024) {
        return
      }

      const viewportHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      // Allow normal scrolling if we're at the bottom
      if (scrollTop + viewportHeight >= documentHeight - 10) {
        return
      }

      // Find current section based on viewport center
      const viewportCenter = scrollTop + viewportHeight / 2
      let currentSectionIndex = -1

      for (let i = 0; i < sections.current.length; i++) {
        const section = sections.current[i]
        if (!section) continue

        const rect = section.getBoundingClientRect()
        const sectionTop = scrollTop + rect.top
        const sectionBottom = sectionTop + rect.height

        if (viewportCenter >= sectionTop && viewportCenter <= sectionBottom) {
          currentSectionIndex = i
          break
        }
      }

      // If no section found, find the closest one
      if (currentSectionIndex === -1) {
        let minDistance = Infinity
        for (let i = 0; i < sections.current.length; i++) {
          const section = sections.current[i]
          if (!section) continue

          const rect = section.getBoundingClientRect()
          const sectionCenter = scrollTop + rect.top + rect.height / 2
          const distance = Math.abs(viewportCenter - sectionCenter)

          if (distance < minDistance) {
            minDistance = distance
            currentSectionIndex = i
          }
        }
      }

      // If we're at the last section and scrolling down, allow normal scrolling
      if (
        currentSectionIndex === sections.current.length - 1 &&
        event.deltaY > 0
      ) {
        return
      }

      // Otherwise, use snap scrolling
      event.preventDefault()

      if (isScrollingRef.current) return
      isScrollingRef.current = true

      const direction = event.deltaY > 0 ? 1 : -1
      const nextIndex = Math.min(
        Math.max(0, currentSectionIndex + direction),
        sections.current.length - 1
      )

      if (sections.current[nextIndex]) {
        const targetSection = sections.current[nextIndex]
        const rect = targetSection.getBoundingClientRect()
        const targetScrollTop = window.pageYOffset + rect.top

        window.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        })
      }

      setTimeout(() => {
        isScrollingRef.current = false
      }, 1000)
    },
    [enableSnapScrolling]
  )

  useEffect(() => {
    if (!enableSnapScrolling) return

    // Use passive: true for better scroll performance by default
    // Only use non-passive when we actually need to preventDefault
    const wheelHandler = (e: WheelEvent) => {
      // Do early return checks first to minimize work
      if (window.innerWidth < 1024) return;
      
      // Only preventDefault if we're actually going to handle the scroll
      const viewportHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // Allow normal scrolling if we're at the bottom
      if (scrollTop + viewportHeight >= documentHeight - 10) return;
      
      // If we're going to handle this, call the handler
      handleScroll(e)
    }
    
    // Use { passive: false } only when necessary
    window.addEventListener('wheel', wheelHandler, { passive: false })

    return () => window.removeEventListener('wheel', wheelHandler)
  }, [handleScroll, enableSnapScrolling])

  const addToRefs = useCallback((el: HTMLDivElement | null) => {
    if (el && !sections.current.includes(el)) {
      sections.current.push(el)
    }
  }, [])

  const contextValue: MainLayoutContext = {
    addToRefs,
  }

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Header />
      <main>
        <Outlet context={contextValue} />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
