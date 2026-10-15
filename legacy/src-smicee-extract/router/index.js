import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import store from '@/store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

// ── Global navigation guards ─────────────────────────────────────────────────

router.beforeEach(async (to, from, next) => {
  // Set document title
  document.title = to.meta.title
    ? `${to.meta.title} — Process Management`
    : 'Process Management'

  const isAuthenticated = store.getters['auth/isAuthenticated']
  const requiresAuth    = to.matched.some((r) => r.meta.requiresAuth)
  const isGuestOnly     = to.matched.some((r) => r.meta.guest)

  // Redirect logged-in users away from guest-only pages (login / register / forgot-password)
  if (isGuestOnly && isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // Confirm the stored access token is still valid (mirrors the legacy
  // `verifyLogin` check on every protected-route navigation).
  if (requiresAuth && isAuthenticated) {
    try {
      await store.dispatch('auth/verifyToken')
    } catch {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  }

  // Permission check — skip for routes without a permission meta
  if (requiresAuth && isAuthenticated && to.meta.permission) {
    // Ensure the permission store reflects the current auth/user before
    // deciding. Relying solely on main.js's one-time bootstrap() call races
    // this guard on a hard refresh — both start independently as soon as
    // the app loads, and whichever finishes first wins, so the same route
    // sometimes passes and sometimes bounces to Unauthorized depending on
    // network timing. fetchPermissions derives synchronously from the
    // already-loaded auth/user (no network call in the normal path), so
    // awaiting it here on every navigation is cheap and makes this check
    // self-sufficient instead of racing bootstrap().
    await store.dispatch('permission/fetchPermissions')
    const hasPermission = store.getters['permission/hasPermission'](to.meta.permission)
    if (!hasPermission) {
      return next({ name: 'Unauthorized' })
    }
  }

  next()
})

// ── After each hook: sync route to sidebar ───────────────────────────────────
router.afterEach((to) => {
  store.dispatch('sidebar/setActiveRoute', to.name)
})

export default router
