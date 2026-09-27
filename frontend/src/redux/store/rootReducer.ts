import { combineReducers } from '@reduxjs/toolkit'
import themeReducer from '../slices/themeSlice'
import authReducer from '../slices/authSlice'
import signupReducer from '../slices/signupSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  signup: signupReducer,
  theme: themeReducer,
})

export default rootReducer
