import axios from 'axios'
import { getStoredToken } from '@/lib/auth-storage'

export const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL ?? 'http://localhost:8080/api/auth'

export const http = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const storedToken = getStoredToken()

  if (storedToken) {
    config.headers.Authorization = `${storedToken.type} ${storedToken.token}`
  }

  return config
})
