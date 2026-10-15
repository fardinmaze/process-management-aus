<template>
  <header class="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-[210] gap-4">

    <!-- Left: brand + mobile toggle -->
    <div class="flex items-center gap-4 min-w-0 shrink-0">
      <router-link
        :to="{ name: homeRouteName }"
        class="hidden md:flex items-center gap-2.5 no-underline shrink-0 pr-4"
      >
      <img src="/logo.png" alt="" class="w-[140px] flex items-center justify-center text-secondary-700 text-xl shrink-0">
        <!-- <div class="w-9 h-9 flex items-center justify-center text-secondary-700 text-xl shrink-0">
          <i class="ri-shield-check-fill" />
        </div> -->
        <!-- <span class="text-base font-bold text-typo-800 whitespace-nowrap">AdminPanel</span> -->
      </router-link>

      <button
        class="md:hidden bg-transparent border-none text-2xl text-slate-600 cursor-pointer p-1 leading-none shrink-0"
        @click="toggleMobile"
        aria-label="Open menu"
      >
        <i class="ri-menu-line" />
      </button>
    </div>

    <div class="flex-1" />

    <!-- Right: actions -->
    <div class="flex items-center gap-1 shrink-0">

      <!-- Punch In/Out — moved here from the dashboard's old "Time
           Tracking" card per the UX audit's W2 finding (a header control,
           not a dashboard card; also now persists across every page
           instead of only ticking while the dashboard route is mounted). -->
      <button
        v-if="showPunchPill"
        type="button" class="punch-pill"
        :class="isPunchedIn ? 'punch-pill--active' : ''"
        :disabled="punchSubmitting"
        @click="togglePunch"
      >
        <i :class="isPunchedIn ? 'ri-logout-box-line' : 'ri-login-box-line'" />
        <span class="hidden sm:inline">{{ isPunchedIn ? elapsedLabel : 'Punch In' }}</span>
      </button>

      <!-- Search -->
      <!-- <div class="relative">
        <button
          v-if="!searchOpen"
          class="icon-action-btn"
          @click="openSearch"
          aria-label="Search"
        >
          <i class="ri-search-line" />
        </button>
        <div v-else class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 h-9">
          <i class="ri-search-line text-slate-400" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Search…"
            class="border-none bg-transparent outline-none focus:outline-none text-sm text-slate-800 w-44"
            @keydown.esc="closeSearch"
            @blur="closeSearch"
          />
          <button class="icon-action-btn" @click="closeSearch">
            <i class="ri-close-line" />
          </button>
        </div>
      </div> -->

      <!-- Notifications -->
      <div class="relative" v-click-outside="closeNotifications">
        <button
          class="icon-action-btn"
          :class="{ 'bg-slate-100 text-brand-600': notifOpen }"
          @click="toggleNotifications"
          aria-label="Notifications"
        >
          <i class="ri-notification-3-line" />
          <span
            v-if="unreadCount"
            class="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[0.65rem] font-bold rounded-full flex items-center justify-center px-0.5"
          >
            {{ unreadCount }}
          </span>
        </button>

        <transition name="dropdown">
          <div v-if="notifOpen" class="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-white border border-slate-200 rounded-xl shadow-lg z-[300] overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 text-sm font-semibold text-slate-800">
              <span>Notifications ({{ unreadCount }})</span>
              <div class="flex items-center gap-3">
                <button
                  v-if="unreadCount"
                  type="button"
                  class="bg-transparent border-none text-xs text-brand-600 cursor-pointer p-0 font-medium hover:underline"
                  @click="markAllRead"
                >
                  Mark all read
                </button>
              </div>
            </div>

            <ul v-if="notifications.length" class=" list-none m-0 p-0 py-1.5 max-h-[300px] overflow-y-auto">
              <li
                v-for="n in notifications"
                :key="n.id"
                class="flex gap-3 px-4 py-2.5 transition-colors cursor-pointer"
                :class="n.read ? 'hover:bg-slate-50' : 'bg-brand-50/60 hover:bg-brand-100/40'"
                @click="goToNotification(n)"
              >
                <div class="w-[34px] h-[34px] rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-base shrink-0">
                  <i :class="n.icon || 'ri-information-line'" />
                </div>
                <div class="min-w-0">
                  <p v-if="n.title" class="text-[0.8rem] font-semibold text-slate-800 m-0 leading-snug">{{ n.title }}</p>
                  <p class="text-[0.78rem] text-slate-600 m-0 mb-0.5 leading-snug">{{ n.message }}</p>
                  <span class="text-[0.7rem] text-slate-400">{{ timeAgo(n.created_at) }}</span>
                </div>
              </li>
            </ul>

            <div v-else class="py-8 px-4 text-center text-slate-400">
              <i class="ri-notification-off-line text-3xl block mb-2" />
              <p class="text-[0.85rem] m-0">No notifications</p>
            </div>
          </div>
        </transition>
      </div>

      <!-- Profile dropdown -->
      <div class="relative" v-click-outside="closeProfile">
        <button
          class="flex items-center gap-2.5 bg-transparent border border-transparent rounded-[10px] px-2.5 py-1 pl-1 cursor-pointer transition-colors"
          :class="{ 'bg-slate-100 border-slate-200': profileOpen }"
          @click="toggleProfile"
          aria-label="Account menu"
        >
          <div class="w-9 h-9 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="photoUrl" :src="photoUrl" :alt="user.name" class="w-full h-full object-cover" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="hidden sm:flex flex-col text-left leading-tight">
            <span class="text-sm font-semibold text-slate-800">{{ user?.name }}</span>
            <span class="text-xs text-slate-800">{{ user?.email }}</span>
      
            <span class="text-[0.7rem] text-slate-500 capitalize">{{ primaryRole }}</span>
          </div>
          <i
            class="ri-arrow-down-s-line text-lg text-slate-400 transition-transform duration-200"
            :class="{ 'rotate-180': profileOpen }"
          />
        </button>

      

        <transition name="dropdown">
          <div v-if="profileOpen" class="absolute top-[calc(100%+8px)] right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[300] overflow-hidden">
            <router-link
              :to="{ name: 'ChangePassword' }"
              class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 no-underline transition-colors hover:bg-slate-50 hover:text-slate-800"
              @click="closeProfile"
            >
              <i class="ri-lock-password-line" />
              <span>Change Password</span>
            </router-link>

            <div class="h-px bg-slate-100 my-1" />

            <button
              class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 w-full text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
              @click="handleLogout"
            >
              <i class="ri-logout-box-r-line" />
              <span>Logout</span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <ErrorModal
      v-if="showLocationError"
      title="Location access needed"
      message="Punch-in couldn't get your location — it looks like this site is blocked from using it. Enable location access for this site in your browser's address-bar/site settings and try again. You can still punch in without it; your entry just won't include a location."
      @close="showLocationError = false"
    />
  </header>
</template>

<script>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore }                from 'vuex'
import { useRouter }               from 'vue-router'
import { getInitials, timeAgo, memberPhotoUrl } from '@/utils/helpers'
import { can }                     from '@/utils/permission'
import { resolveNotificationRoute } from '@/utils/notificationRoutes'
import ErrorModal                  from '@/components/common/ErrorModal.vue'

const LIVE_TICK_MS = 30000

export default {
  name: 'AppNavbar',

  components: { ErrorModal },

  directives: {
    'click-outside': {
      mounted(el, binding) {
        el.__clickOutside__ = (e) => { if (!el.contains(e.target)) binding.value() }
        document.addEventListener('mousedown', el.__clickOutside__)
      },
      unmounted(el) {
        document.removeEventListener('mousedown', el.__clickOutside__)
        delete el.__clickOutside__
      },
    },
  },

  setup() {
    const store  = useStore()
    const router = useRouter()

    const user        = computed(() => store.getters['auth/user'])
    const homeRouteName = computed(() => 'Dashboard')
    const initials    = computed(() => getInitials(user.value?.name ?? ''))
    const photoUrl    = computed(() => memberPhotoUrl(user.value))
    const primaryRole = computed(() => {
      const roles = store.getters['auth/userRoles']
      if (!roles.length) return ''
      const first = roles[0]
      return typeof first === 'string' ? first : first.name
    })

    // Punch In/Out pill — ported from the old dashboard PunchWidget.vue,
    // now living here so the live elapsed-time tick keeps running across
    // every page instead of dying when the user navigates off Dashboard.
    const showPunchPill    = computed(() => user.value?.is_employee)
    const punchSubmitting  = ref(false)
    const showLocationError = ref(false)
    const now = ref(Date.now())
    let tickHandle = null

    const timeSheetLatest = computed(() => store.getters['punch/timeSheetLatest'])
    const isPunchedIn = computed(() => timeSheetLatest.value?.status === 'IN')
    const elapsedLabel = computed(() => {
      if (!isPunchedIn.value || !timeSheetLatest.value?.punch_in_time) return 'Punch In'
      const elapsedMs = now.value - new Date(timeSheetLatest.value.punch_in_time).getTime()
      const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000))
      const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
      const mm = String(totalMinutes % 60).padStart(2, '0')
      return `${hh}:${mm}`
    })

    // Browsers only show their own "allow location?" prompt once — if
    // already denied, getCurrentPosition just errors with no further
    // browser UI, so PERMISSION_DENIED is the one case worth a custom
    // modal for (the user can actually fix it via site settings).
    function requestLocation() {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => {
            if (err.code === err.PERMISSION_DENIED) showLocationError.value = true
            resolve(null)
          },
          { timeout: 5000 },
        )
      })
    }

    async function togglePunch() {
      punchSubmitting.value = true
      try {
        const location = await requestLocation()
        await store.dispatch('punch/addAttende', location)
      } finally {
        punchSubmitting.value = false
      }
    }

    onMounted(() => {
      if (showPunchPill.value) store.dispatch('punch/fetchLatestTimeSheet')
      tickHandle = setInterval(() => { now.value = Date.now() }, LIVE_TICK_MS)
    })
    onBeforeUnmount(() => {
      if (tickHandle) clearInterval(tickHandle)
    })

    // Search
    const searchOpen  = ref(false)
    const searchQuery = ref('')
    const searchInput = ref(null)
    async function openSearch() { searchOpen.value = true; await nextTick(); searchInput.value?.focus() }
    function closeSearch()      { searchOpen.value = false; searchQuery.value = '' }

    // Notifications — GET /api/notification/get-notification (store/notification.js)
    const notifOpen     = ref(false)
    const notifications = computed(() => store.getters['notification/list'])
    const unreadCount   = computed(() => store.getters['notification/unreadCount'])
    function toggleNotifications() {
      notifOpen.value = !notifOpen.value
      profileOpen.value = false
      if (notifOpen.value) store.dispatch('notification/fetchNotifications')
    }
    function closeNotifications()  { notifOpen.value = false }
    function markAllRead()         { store.dispatch('notification/markAllRead') }

    async function goToNotification(n) {
      closeNotifications()
      if (!n.read) store.dispatch('notification/toggleNotification', n.id)
      const route = await resolveNotificationRoute(n, store)
      if (route) router.push(route)
    }

    onMounted(() => {
      store.dispatch('notification/fetchNotifications')
      store.dispatch('notification/fetchUnseenCount')
    })

    // Profile
    const profileOpen = ref(false)
    function toggleProfile() { profileOpen.value = !profileOpen.value; notifOpen.value = false }
    function closeProfile()  { profileOpen.value = false }

    function toggleMobile() { store.dispatch('sidebar/toggleMobile') }

    async function handleLogout() {
      closeProfile()
      await store.dispatch('auth/logout')
      router.push({ name: 'Login' })
    }

    return {
      user, homeRouteName, initials, photoUrl, primaryRole,
      showPunchPill, punchSubmitting, showLocationError, isPunchedIn, elapsedLabel, togglePunch,
      searchOpen, searchQuery, searchInput, openSearch, closeSearch,
      notifOpen, notifications, unreadCount, toggleNotifications, closeNotifications, markAllRead, goToNotification,
      profileOpen, toggleProfile, closeProfile,
      toggleMobile, handleLogout, timeAgo, can,
    }
  },
}
</script>

<style scoped>
.punch-pill {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px; border-radius: 999px;
  font-size: 0.8125rem; font-weight: 600; white-space: nowrap;
  background: #f1f5f9; color: #475569; border: 1px solid transparent;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.punch-pill:hover:not(:disabled) { background: #e2e8f0; }
.punch-pill:disabled { opacity: 0.6; cursor: default; }
.punch-pill--active { background: #d9f2dc; color: #006b14; }
.punch-pill--active:hover:not(:disabled) { background: #c5ebc9; }

.icon-action-btn {
  position: relative;
  width: 38px; height: 38px;
  border-radius: 8px;
  background: transparent; border: none;
  font-size: 18px; color: #475569;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.icon-action-btn:hover { background: #f1f5f9; color: #2D5A27; }

.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* Thin scrollbar for scrollable dropdown lists */
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}
.thin-scrollbar::-webkit-scrollbar { width: 6px; }
.thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
.thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.15);
  border-radius: 3px;
}
.thin-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.25); }
</style>
