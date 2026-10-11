import { createApp }   from 'vue'
import App             from './App.vue'
import router          from './router'
import store           from './store'
import { vCan, vRole } from './utils/permission'

// Global base styles
import './assets/styles/main.css'
import './assets/styles/crud.css';


// CK
import 'ckeditor5/ckeditor5.css'
import 'ckeditor5/ckeditor5-content.css'

const app = createApp(App)

// ── Plugins ───────────────────────────────────────────────────────────────────
app.use(store)
app.use(router)

// ── Global custom directives ─────────────────────────────────────────────────
// v-can="'user.create'"        → hide if user lacks permission
// v-can.any="['a','b']"        → hide if user lacks all listed permissions
// v-role="'admin'"             → hide if user lacks role
app.directive('can',  vCan)
app.directive('role', vRole)

// ── Global properties ─────────────────────────────────────────────────────────
// Access in Options API via: this.$filters.formatDate(val)
import { formatDate, formatDateTime, timeAgo, truncate, formatNumber } from './utils/helpers'

app.config.globalProperties.$filters = {
  formatDate,
  formatDateTime,
  timeAgo,
  truncate,
  formatNumber,
}

// ── Global error handler ──────────────────────────────────────────────────────
app.config.errorHandler = (err, instance, info) => {
  // Ignore navigation cancellations (e.g. redirect mid-guard)
  if (err?.name === 'NavigationDuplicated') return

  console.error(`[Vue error] ${info}`, err)

  // Surface the error in the toast system if the root component is ready
  const rootProxy = app._instance?.proxy
  if (rootProxy) {
    const toast = rootProxy.$.appContext.provides?.toast
    toast?.error(
      err?.message ?? 'An unexpected error occurred.',
      'Application Error'
    )
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Rehydrate the authenticated session from localStorage before the first render.
// This prevents a flash of the login page when the user refreshes with a valid token.
async function bootstrap() {
  const token = store.getters['auth/token']

  if (token) {
    try {
      // `user` is already rehydrated synchronously from localStorage by the
      // auth module's state() initializer — just confirm the token is still
      // valid and rebuild the permission list from that cached user.
      await store.dispatch('auth/verifyToken')
      await store.dispatch('permission/fetchPermissions')
    } catch {
      // verifyToken calls CLEAR_AUTH on failure, so no extra handling needed here
    }
  }

  app.mount('#app')
}

bootstrap()
