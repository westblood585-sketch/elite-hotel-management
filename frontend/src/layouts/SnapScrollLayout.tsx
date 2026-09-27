// components/layouts/SnapScrollLayout.tsx (Wrapper for pages that need snap scrolling)
import React from 'react'
import MainLayout from './MainLayout'

const SnapScrollLayout: React.FC = () => {
  return <MainLayout enableSnapScrolling={true} />
}

export default SnapScrollLayout
