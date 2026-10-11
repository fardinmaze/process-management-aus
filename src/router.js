import { createRouter, createWebHistory } from 'vue-router'
import { session, hasRole } from '@/session'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
  { path: '/invite/accept/:token', name: 'invite', component: () => import('@/views/AcceptInvite.vue'), meta: { guest: true } },
  {
    path: '/', component: () => import('@/components/Shell.vue'), meta: { auth: true }, children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'maps', name: 'maps', component: () => import('@/views/MapList.vue') },
      { path: 'maps/new', name: 'map-new', component: () => import('@/views/MapNew.vue'), meta: { roles: ['ADMIN', 'OWNER'] } },
      { path: 'maps/:id', name: 'map', component: () => import('@/views/MapOverview.vue'), props: true },
      { path: 'maps/:id/canvas', name: 'canvas', component: () => import('@/views/Canvas.vue'), props: true },
      { path: 'published', name: 'published', component: () => import('@/views/Published.vue') },
      { path: 'published/:id', name: 'published-map', component: () => import('@/views/PublishedMap.vue'), props: true },
      { path: 'my-work', name: 'my-work', component: () => import('@/views/MyWork.vue'), meta: { roles: ['OWNER', 'CONTRIBUTOR'] } },
      { path: 'reviews', name: 'reviews', component: () => import('@/views/Reviews.vue'), meta: { roles: ['APPROVER'] } },
      { path: 'admin/users', name: 'admin-users', component: () => import('@/views/admin/Users.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'admin/invitations', name: 'admin-invitations', component: () => import('@/views/admin/Invitations.vue'), meta: { roles: ['ADMIN', 'OWNER'] } },
      { path: 'admin/folders', name: 'admin-folders', component: () => import('@/views/admin/Folders.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'admin/approval-chain', name: 'admin-chain', component: () => import('@/views/admin/ApprovalChain.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'admin/activity', name: 'admin-activity', component: () => import('@/views/admin/Activity.vue'), meta: { roles: ['ADMIN'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

// Convenience only. Every action is re-checked server-side (see mock/server.js).
router.beforeEach((to) => {
  if (to.meta.auth && !session.user) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guest && session.user && to.name === 'login') return { path: '/dashboard' }
  const roles = to.matched.flatMap((r) => r.meta.roles || [])
  if (roles.length && !hasRole(...roles)) return { path: '/dashboard' }
})
export default router
