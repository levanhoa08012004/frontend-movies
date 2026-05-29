import { createContext } from 'react'

/** Tách khỏi AuthProvider để Vite Fast Refresh không báo hook/provider “incompatible”. */
export const AuthContext = createContext(null)
