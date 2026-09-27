//redux/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  phoneNumber?: string
  profileImage?: string
  avatar?: {
    publicId: string
    url: string
  }
}

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: User | null
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token
      state.isAuthenticated = true
      state.user = action.payload.user
    },
    logout: (state) => {
      state.token = null
      state.isAuthenticated = false
      state.user = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    updateAvatar: (state, action: PayloadAction<{ publicId: string; url: string } | null>) => {
      if (state.user) {
        state.user.avatar = action.payload || undefined
      }
    },
  },
})

export const { login, logout, updateUser, updateAvatar } = authSlice.actions
export default authSlice.reducer
