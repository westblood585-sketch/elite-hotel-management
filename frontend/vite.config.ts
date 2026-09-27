import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
    },
  },
  build: {
    // Improved chunking strategy for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split node_modules into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@tanstack/react-query', 'sonner', 'framer-motion'],
          'socket-vendor': ['socket.io-client'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'redux': ['redux', 'react-redux', '@reduxjs/toolkit'],
          // Split large pages into their own chunks
          'admin-pages': ['admin/Dashboard', 'admin/Rooms', 'admin/Reservations', 'admin/Users'],
          'dashboard-widgets': ['admin/widgets/RevenueChart', 'admin/widgets/OccupancyChart'],
        },
      },
    },
    // Increase chunk size warning limit slightly
    chunkSizeWarningLimit: 600,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
      },
    },
  },
  // Performance optimizations
  server: {
    middlewareMode: false,
  },
  preview: {
    port: 3000,
  },
})

