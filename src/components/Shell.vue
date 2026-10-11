<template>
  <div class="flex h-full">
    <aside class="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div class="px-5 py-4 border-b border-slate-100">
        <div class="text-lg font-bold text-brand-700">Process Maps</div>
        <div class="text-[11px] text-slate-400">Collaborative process mapping</div>
      </div>
      <nav class="flex-1 overflow-y-auto p-3 text-sm">
        <template v-for="group in visibleNav" :key="group.title">
          <div class="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ group.title }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="block rounded-lg px-3 py-2 text-slate-600 no-underline hover:bg-slate-50"
            active-class="!bg-brand-50 !text-brand-700 font-semibold"
          >{{ item.label }}</router-link>
        </template>
      </nav>
      <div class="p-3 border-t border-slate-100 text-xs text-slate-400">
        <button class="btn btn-sm w-full" @click="reset">Reset demo data</button>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-end gap-4 px-5">
        <div class="relative">
          <button class="btn btn-sm" @click="toggleNotifs">
            Notifications
            <span v-if="unread" class="chip bg-red-500 text-white">{{ unread }}</span>
          </button>
          <div v-if="notifOpen" class="absolute right-0 top-10 w-96 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
            <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <span class="text-sm font-semibold">Notifications</span>
              <button class="text-xs text-brand-600 bg-transparent border-0 cursor-pointer" @click="markAll">Mark all read</button>
            </div>
            <div v-if="!session.notifications.length" class="p-4 text-sm text-slate-400">Nothing yet.</div>
            <div
              v-for="n in session.notifications"
              :key="n.id"
              class="px-4 py-2.5 border-b border-slate-50 text-sm cursor-pointer hover:bg-slate-50"
              :class="n.read ? 'text-slate-400' : 'text-slate-700'"
              @click="openNotif(n)"
            >
              {{ n.text }}
              <div class="text-[11px] text-slate-400">{{ fmt(n.at) }}</div>
            </div>
          </div>
        </div>
        <div class="text-right leading-tight">
          <div class="text-sm font-semibold">{{ session.user.name }}</div>
          <div class="text-[11px] text-slate-400">{{ session.user.roles.join(' · ') }}</div>
        </div>
        <button class="btn btn-sm" @click="signOut">Sign out</button>
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
let timer = null

const NAV = [
  { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard' }] },
  { title: 'Work', roles: ['OWNER', 'CONTRIBUTOR'], items: [{ to: '/my-work', label: 'My work', roles: ['OWNER', 'CONTRIBUTOR'] }, { to: '/todos', label: 'To-do list', roles: ['OWNER', 'CONTRIBUTOR'] }] },
  { title: 'Review', roles: ['APPROVER'], items: [{ to: '/reviews', label: 'Approval inbox', roles: ['APPROVER'] }] },
  {
    title: 'Process maps', items: [
      { to: '/maps', label: 'Maps in progress', roles: ['ADMIN', 'OWNER', 'CONTRIBUTOR', 'APPROVER'] },
      { to: '/maps/new', label: 'New map', roles: ['ADMIN', 'OWNER'] },
      { to: '/published', label: 'Published maps' },
    ],
  },
  {
    title: 'Admin', roles: ['ADMIN', 'OWNER'], items: [
      { to: '/admin/invitations', label: 'Invitations', roles: ['ADMIN', 'OWNER'] },
      { to: '/admin/users', label: 'Users & roles', roles: ['ADMIN'] },
      { to: '/admin/folders', label: 'Folders', roles: ['ADMIN'] },
      { to: '/admin/roles-systems', label: 'Roles & systems', roles: ['ADMIN'] },
      { to: '/admin/approval-chain', label: 'Approval chain', roles: ['ADMIN'] },
      { to: '/admin/activity', label: 'Activity log', roles: ['ADMIN'] },
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
