/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/xiosConfig.ts
import axios from 'axios'
import { toast } from 'sonner'
import { logout } from '@/redux/slices/authSlice'
import { store } from '@/redux/store/store'

const authBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const api = axios.create({
  baseURL: authBaseUrl,
  withCredentials: true,
})

// Private API (for token-based requests)
export const privateApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

// Attach token to private requests
privateApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const guestToken = localStorage.getItem('guest_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[Axios] Using Staff Token')
    } else if (guestToken) {
       config.headers.Authorization = `Bearer ${guestToken}`
       console.log('[Axios] Using Guest Token')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

privateApi.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // ALLOW guest token refresh (removed blocking check)
      // if (!localStorage.getItem('token') && localStorage.getItem('guest_token')) {
      //   return Promise.reject(error)
      // }

      originalRequest._retry = true
      try {
        const response = await privateApi.get('/auth/refresh-token')
        if (response.status === 200) {
          const newAccessToken = response.data.accessToken
          localStorage.setItem('token', newAccessToken)
          // Dispatch event so SocketContext can pick it up
          window.dispatchEvent(new Event('token-refreshed'))
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return privateApi(originalRequest)
        }
      } catch (refreshError: any) {
        if (refreshError.response?.status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('guest_token')
          localStorage.removeItem('guest_id')

          // Dispatch the logout action from the auth slice
          store.dispatch(logout())
        }
        console.error('Refresh token failed:', refreshError)
        throw error
      }
    }
    
    // Global Network Error Handling
     if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        toast.error("Network Error: Unable to connect to server. Please check your internet connection.")
     }
     return Promise.reject(error)
   }
 )
