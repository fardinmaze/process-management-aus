import axios from 'axios'
import store from '@/store'
import router from '@/router'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor ──────────────────────────────────────────────────────
instance.interceptors.request.use(
  (config) => {
    const token = store.getters['auth/token']
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────────────────────
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // The token endpoints (obtain/refresh/verify) must never trigger this
    // auto-refresh-and-retry branch themselves — otherwise a 401 from the
    // refresh call re-enters this same interceptor and recurses forever.
    const isTokenEndpoint = originalRequest?.url?.includes('/authentication/token')

    if (error.response?.status === 401 && !originalRequest._retry && !isTokenEndpoint) {
      originalRequest._retry = true

      try {
        await store.dispatch('auth/refreshToken')
        const newToken = store.getters['auth/token']
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return instance(originalRequest)
      } catch {
        await store.dispatch('auth/logout')
        router.push({ name: 'Login' })
        return Promise.reject(error)
      }
    }

    // Background/widget calls (e.g. the chat inbox poll) opt out of the
    // full-page redirects with `{ skipErrorRedirect: true }` so a failing
    // side feature never navigates the user away from their page.
    if (!originalRequest?.skipErrorRedirect) {
      if (error.response?.status === 403) {
        router.push({ name: 'Unauthorized' })
      }

      if (error.response?.status === 404) {
        router.push({ name: 'NotFound' })
      }
    }

    return Promise.reject(error)
  }
)

export default instance
