<template>
  <div id="app-root">
    <!-- Top progress bar -->
    <div
      class="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none transition-opacity duration-200"
      :class="routeLoading ? 'opacity-100' : 'opacity-0'"
    >
      <div class="h-full w-0 bg-gradient-to-r from-brand-600 to-brand-400 rounded-r-sm shadow-[0_0_8px_rgba(45,90,39,0.6)]" style="animation: progress-fill 1.8s ease-in-out infinite" />
    </div>

    <!-- Router view -->
    <router-view />

    <!-- Global toast notifications -->
    <teleport to="body">
      <transition-group
        name="toast"
        tag="div"
        class="fixed bottom-6 right-6 z-[9000] flex flex-col gap-2.5 pointer-events-none max-w-[360px] w-[calc(100vw-48px)]"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          @click="removeToast(toast.id)"
        >
          <i :class="toastIcon(toast.type)" class="text-xl shrink-0 mt-px" />
          <div class="flex-1 min-w-0">
            <p v-if="toast.title" class="text-sm font-bold text-slate-800 m-0 mb-0.5">{{ toast.title }}</p>
            <p class="text-[0.82rem] text-slate-500 m-0 leading-snug">{{ toast.message }}</p>
            <router-link
              v-if="toast.action" :to="toast.action.to" class="toast__action"
              @click.stop="removeToast(toast.id)"
            >
              {{ toast.action.label }} <i class="ri-arrow-right-line" />
            </router-link>
          </div>
          <button
            class="bg-transparent border-none text-slate-400 cursor-pointer text-base p-0 shrink-0 leading-none flex transition-colors hover:text-slate-600"
            @click.stop="removeToast(toast.id)"
          >
            <i class="ri-close-line" />
          </button>
        </div>
      </transition-group>
    </teleport>

    <!-- Long-form errors that don't fit a toast -->
    <ErrorModal
      v-if="errorModal"
      :title="errorModal.title"
      :message="errorModal.message"
      @close="errorModal = null"
    />
  </div>
</template>

<script>
import { ref, provide, onMounted } from 'vue'
import { useRouter }               from 'vue-router'
import ErrorModal                  from '@/components/common/ErrorModal.vue'

let toastId = 0

// Toasts are capped at 360px wide — past this many characters a message
// wraps into an unreadable wall of text, so it goes to a modal instead.
const ERROR_MODAL_THRESHOLD = 160

export default {
  name: 'App',
  components: { ErrorModal },

  setup() {
    const router       = useRouter()
    const routeLoading = ref(false)
    const toasts       = ref([])
    const errorModal   = ref(null)

    router.beforeEach(() => { routeLoading.value = true })
    router.afterEach(()  => { setTimeout(() => { routeLoading.value = false }, 300) })

    function addToast({ type = 'info', title = '', message = '', action = null, duration }) {
      const id = ++toastId
      // A toast carrying a link to go verify something needs more time on
      // screen than a plain fire-and-forget confirmation.
      const resolvedDuration = duration ?? (action ? 6000 : 3500)
      toasts.value.push({ id, type, title, message, action })
      if (resolvedDuration > 0) setTimeout(() => removeToast(id), resolvedDuration)
    }

    function removeToast(id) {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    function toastIcon(type) {
      return {
        success: 'ri-checkbox-circle-line',
        error:   'ri-error-warning-line',
        warning: 'ri-alert-line',
        info:    'ri-information-line',
      }[type] ?? 'ri-information-line'
    }

    // `action`, when given, is a `{ label, to }` pair — `to` is anything
    // <router-link :to> accepts (a route object or name). Renders as a link
    // inside the toast so the user can jump straight to what changed
    // instead of having to go find it themselves.
    const toast = {
      success: (message, title = '', action = null) => addToast({ type: 'success', message, title, action }),
      error:   (message, title = 'Error') => {
        if ((message || '').length > ERROR_MODAL_THRESHOLD) {
          errorModal.value = { title, message }
        } else {
          addToast({ type: 'error', message, title })
        }
      },
      warning: (message, title = '', action = null) => addToast({ type: 'warning', message, title, action }),
      info:    (message, title = '', action = null) => addToast({ type: 'info',    message, title, action }),
    }

    provide('toast', toast)

    onMounted(() => {
      window.addEventListener('unhandledrejection', (e) => {
        if (e.reason?.name === 'AbortError') return
        console.error('[Unhandled rejection]', e.reason)
      })
    })

    return { routeLoading, toasts, removeToast, toastIcon, errorModal }
  },
}
</script>

<style>
@keyframes progress-fill {
  0%   { width: 0%;   opacity: 1; }
  70%  { width: 85%;  opacity: 1; }
  100% { width: 100%; opacity: 0; }
}

.toast {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  border-radius: 12px; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.12);
  border-left: 4px solid transparent; pointer-events: all; cursor: pointer;
  transition: box-shadow 0.15s;
}
.toast:hover    { box-shadow: 0 10px 36px rgba(0,0,0,.16); }
.toast--success { border-color: #10b981; }
.toast--error   { border-color: #ef4444; }
.toast--warning { border-color: #f59e0b; }
.toast--info    { border-color: #2D5A27; }
.toast--success i.text-xl { color: #10b981; }
.toast--error   i.text-xl { color: #ef4444; }
.toast--warning i.text-xl { color: #f59e0b; }
.toast--info    i.text-xl { color: #2D5A27; }

.toast-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from   { opacity: 0; transform: translateX(40px) scale(0.9); }
.toast-leave-to     { opacity: 0; transform: translateX(40px); }
.toast-move         { transition: transform 0.3s ease; }
</style>
