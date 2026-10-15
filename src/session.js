import { reactive } from 'vue'
import { call } from '@/api'

export const session = reactive({ user: null, ready: false, notifications: [] })

export async function loadSession() {
  try { session.user = await call('auth/me') } catch { session.user = null }
  session.ready = true
}
export async function login(email, password) {
  session.user = await call('auth/login', { email, password })
  return session.user
}
export async function logout() {
  await call('auth/logout')
  session.user = null
  session.notifications = []
}
export const hasRole = (...r) => !!session.user && session.user.roles.some((x) => r.includes(x))
export async function refreshNotifications() {
  if (!session.user) return
  try { session.notifications = await call('notification/list') } catch { /* ignore */ }
}

// toasts
export const toasts = reactive([])
let tid = 0
export function toast(message, type = 'success') {
  const id = ++tid
  toasts.push({ id, message, type })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i > -1) toasts.splice(i, 1)
  }, type === 'error' ? 6000 : 3000)
}
export const errMsg = (e) => e?.message || 'Something went wrong.'
