// Navbar's notification bell.
//   GET  /api/notification/get-notification              — the list
//   GET  /api/notification/toggle-notification/<noti_id> — flip one row's read state
//   GET  /api/notification/toggle-notification-all       — mark every row read
//   GET  /api/notification/count-notification            — unseen count for the bell badge
// (GET with a path param, no body, matching this codebase's other
// toggle-style endpoints — e.g. task/toggle-complete — and task.txt's
// documented clock-in/out convention.)
//
// get-notification's response is a plain array of rows shaped like:
//   { id, title, body, type, payload, is_read, created_at, updated_at, user }
// `type` + `payload` are what Navbar.vue's click-through uses to route to
// the right details page (`payload` is that record's own id, as a string).
import api   from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  list:        [],
  unseenCount: 0,
  loading:     false,
  error:       false,
})

const getters = {
  list:        (state) => state.list,
  unreadCount: (state) => state.unseenCount,
  loading:     (state) => state.loading,
  error:       (state) => state.error,
}

// One icon per notification `type`, since the backend doesn't send one.
const TYPE_ICON = {
  task:        'ri-task-line',
  project:     'ri-briefcase-4-line',
  requisition: 'ri-file-list-3-line',
  lead:        'ri-user-star-line',
  leave:       'ri-calendar-event-line',
  eod:         'ri-file-text-line',
  ticket:      'ri-ticket-2-line',
}

function normalize(row, idx) {
  return {
    id:         row.id ?? idx,
    title:      row.title ?? '',
    message:    row.body ?? row.message ?? row.title ?? '',
    type:       row.type ?? null,
    payload:    row.payload ?? null,
    icon:       TYPE_ICON[row.type] ?? row.icon ?? 'ri-information-line',
    read:       row.is_read ?? row.read ?? false,
    created_at: row.created_at ?? row.timestamp ?? null,
  }
}

// count-notification's exact envelope isn't documented — accept a bare
// number or the common {count}/{unread_count}/{data} wrapper shapes.
function extractCount(data) {
  if (typeof data === 'number') return data
  return data?.count ?? data?.unread_count ?? data?.unseen_count ?? data?.data ?? 0
}

const mutations = {
  SET_NOTIFICATIONS(state, rows) {
    state.list = (rows || []).map(normalize)
  },

  SET_ONE_READ(state, id) {
    const row = state.list.find((n) => n.id === id)
    if (row) row.read = true
  },

  SET_ALL_READ(state) {
    state.list = state.list.map((n) => ({ ...n, read: true }))
  },

  SET_UNSEEN_COUNT(state, count) {
    state.unseenCount = count
  },

  NOTIFICATIONS_LOADING(state, loading) {
    state.loading = loading
  },

  NOTIFICATIONS_ERROR(state, hasError) {
    state.error = hasError
  },
}

const actions = {
  async fetchNotifications({ commit }) {
    commit('NOTIFICATIONS_LOADING', true)
    commit('NOTIFICATIONS_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_notification)
      commit('SET_NOTIFICATIONS', data?.data ?? data?.results ?? data)
      return data
    } catch (e) {
      commit('NOTIFICATIONS_ERROR', true)
    } finally {
      commit('NOTIFICATIONS_LOADING', false)
    }
  },

  async fetchUnseenCount({ commit }) {
    try {
      const { data } = await api.get(V1API.notification_count)
      commit('SET_UNSEEN_COUNT', extractCount(data))
      return data
    } catch (e) {
      commit('NOTIFICATIONS_ERROR', true)
    }
  },

  // Marks a single row read (optimistic locally) and refreshes the badge
  // count from the server, since toggling changes it.
  async toggleNotification({ commit, dispatch }, id) {
    commit('SET_ONE_READ', id)
    try {
      const { data } = await api.get(`${V1API.toggle_notification}${id}`)
      dispatch('fetchUnseenCount')
      return data
    } catch (e) {
      commit('NOTIFICATIONS_ERROR', true)
    }
  },

  async markAllRead({ commit }) {
    commit('SET_ALL_READ')
    commit('SET_UNSEEN_COUNT', 0)
    try {
      const { data } = await api.get(V1API.toggle_notification_all)
      return data
    } catch (e) {
      commit('NOTIFICATIONS_ERROR', true)
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
