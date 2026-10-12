<template>
  <div class="flex h-full">
    <div v-if="navOpen" class="fixed inset-0 z-30 bg-black/40 md:hidden" @click="navOpen = false" />
    <aside id="main-nav" class="w-64 shrink-0 bg-white border-r border-slate-300 flex flex-col fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0" :class="navOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="px-5 py-4 border-b-4 border-gold-500">
        <div class="text-lg font-bold text-brand-600 flex items-center gap-2"><Icon name="map" :size="20" />Process Maps</div>
        <div class="text-[11px] text-slate-500">Collaborative process mapping</div>
      </div>
      <nav class="flex-1 overflow-y-auto p-3 text-sm">
        <template v-for="group in visibleNav" :key="group.title">
          <div class="px-2 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-brand-900">{{ group.title }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center rounded px-3 py-2 text-slate-700 no-underline hover:bg-brand-50"
            active-class="!bg-brand-600 !text-white font-semibold"
          ><Icon :name="item.icon" :size="17" class="mr-2.5" />{{ item.label }}</router-link>
        </template>
      </nav>
      <div class="p-3 border-t border-slate-100 text-xs text-slate-500">
        <button class="btn btn-sm w-full" @click="reset"><Icon name="refresh" :size="14" />Reset demo data</button>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="h-14 shrink-0 bg-white border-b border-slate-300 flex items-center gap-3 px-3 sm:px-5">
        <button class="btn btn-sm md:hidden" aria-label="Open menu" aria-controls="main-nav" :aria-expanded="navOpen" @click="navOpen = true"><Icon name="menu" :size="16" /></button>
        <div class="flex-1" />
        <div class="relative">
          <button class="btn btn-sm" @click="toggleNotifs">
            <Icon name="bell" :size="14" /><span class="hidden sm:inline">Notifications</span>
            <span v-if="unread" class="chip bg-red-500 text-white">{{ unread }}</span>
          </button>
          <div v-if="notifOpen" class="absolute right-0 top-10 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm max-h-96 overflow-y-auto bg-white border border-slate-200 rounded shadow-xl z-50">
            <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <span class="text-sm font-semibold">Notifications</span>
              <button class="text-xs text-brand-600 bg-transparent border-0 cursor-pointer" @click="markAll">Mark all read</button>
            </div>
            <div v-if="!session.notifications.length" class="p-4 text-sm text-slate-500">Nothing yet.</div>
            <div
              v-for="n in session.notifications"
              :key="n.id"
              class="px-4 py-2.5 border-b border-slate-50 text-sm cursor-pointer hover:bg-slate-50"
              :class="n.read ? 'text-slate-500' : 'text-slate-700'"
              @click="openNotif(n)"
            >
              {{ n.text }}
              <div class="text-[11px] text-slate-500">{{ fmt(n.at) }}</div>
            </div>
          </div>
        </div>
        <div class="text-right leading-tight hidden sm:block">
          <div class="text-sm font-semibold">{{ session.user?.name }}</div>
          <div class="text-[11px] text-slate-500">{{ session.user?.roles.join(' · ') }}</div>
        </div>
        <button class="btn btn-sm" @click="signOut"><Icon name="logout" :size="14" /><span class="hidden sm:inline">Sign out</span></button>
      </header>
      <main class="flex-1 min-h-0 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { session, hasRole, logout, refreshNotifications } from '@/session'
import { call, resetDemo } from '@/api'
import { fmt } from '@/util'

const router = useRouter()
const notifOpen = ref(false)
const navOpen = ref(false)
router.afterEach(() => { navOpen.value = false })
let timer = null

const NAV = [
  { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }] },
  { title: 'Review', roles: ['APPROVER'], items: [{ to: '/reviews', label: 'Approval inbox', icon: 'inbox', roles: ['APPROVER'] }] },
  {
    title: 'Process maps', items: [
      { to: '/maps', label: 'Maps in progress', icon: 'layers', roles: ['ADMIN', 'OWNER', 'CONTRIBUTOR', 'APPROVER'] },
      { to: '/maps/new', label: 'New map', icon: 'plus', roles: ['ADMIN', 'OWNER'] },
      { to: '/published', label: 'Published maps', icon: 'book' },
    ],
  },
  {
    title: 'Admin', roles: ['ADMIN', 'OWNER'], items: [
      { to: '/admin/invitations', label: 'Invitations', icon: 'mail', roles: ['ADMIN', 'OWNER'] },
      { to: '/admin/users', label: 'Users & roles', icon: 'users', roles: ['ADMIN'] },
      { to: '/admin/folders', label: 'Folders', icon: 'folder', roles: ['ADMIN'] },
      { to: '/admin/roles-systems', label: 'Roles & systems', icon: 'user', roles: ['ADMIN'] },
      { to: '/admin/approval-chain', label: 'Approval chain', icon: 'shield', roles: ['ADMIN'] },
      { to: '/admin/activity', label: 'Activity log', icon: 'activity', roles: ['ADMIN'] },
    ],
  },
]
const visibleNav = computed(() =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || hasRole(...i.roles)) })).filter((g) => g.items.length && (!g.roles || hasRole(...g.roles))),
)
const unread = computed(() => session.notifications.filter((n) => !n.read).length)

async function toggleNotifs() { notifOpen.value = !notifOpen.value; if (notifOpen.value) await refreshNotifications() }
async function markAll() { await call('notification/read-all'); await refreshNotifications() }
function openNotif(n) { notifOpen.value = false; if (n.link) router.push(n.link) }
async function signOut() { await logout(); router.push('/login') }
function reset() {
  if (!confirm('Reset all demo data (maps, users, invitations) and sign out?')) return
  resetDemo()
  location.href = '/login'
}
onMounted(() => { refreshNotifications(); timer = setInterval(refreshNotifications, 15000) })
onBeforeUnmount(() => clearInterval(timer))
</script>
