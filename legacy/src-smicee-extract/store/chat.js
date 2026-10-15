// Backing store for the floating chat module (src/components/chat/*).
// REST + WebSocket contract: CHAT_API_DOCUMENTATION.md. Every REST call
// answers HTTP 200 with a { code, response, data|error } envelope, so each
// action checks `body.code` itself and throws on anything but 200.
//
// Live sockets are kept in a module-level Map rather than in state — Vuex
// runs in strict mode in dev, and a WebSocket instance mutates itself
// (readyState etc.) outside of mutations.
import api from '@/plugins/axios'
import V1API, { chatSocketUrl } from '@/utils/apiPaths'
import { personPhoto, RECORD_TYPES, isRecordChannel } from '@/components/chat/chatHelpers'

const sockets = new Map()        // channelId -> WebSocket
const typingTimers = new Map()   // `${channelId}:${userId}` -> timeout id
let refreshing = null            // in-flight token refresh, shared
// Opening chat collapses the app sidebar to give the three columns room;
// closing restores it — but only if chat was what collapsed it.
let sidebarCollapsedByChat = false

const CONNECT_TIMEOUT_MS = 10000 // a handshake still pending after this is treated as refused

// Outgoing messages sent while the socket is (re)connecting wait here and
// flush on open, instead of failing with "not connected".
const outbox = new Map()          // channelId -> [{ payload, resolve, timer }]
const OUTBOX_TIMEOUT_MS = 20000

// Dropped connections reconnect with backoff. A *fresh* handshake that's
// refused is final (§5), but refusals while re-establishing a previously
// working connection are usually transient (network blip, deploy).
const reconnectTimers = new Map() // channelId -> timeout id
const reconnectTries = new Map()  // channelId -> attempts since last open
const BACKOFF_MS = [300, 1000, 2000, 4000, 8000, 15000]

// Keepalive: a no-op `typing:false` when the socket has been quiet, so
// idle-timeout proxies don't cut it. Skipped while the user is typing.
const keepalives = new Map()      // channelId -> interval id
const lastSent = new Map()        // channelId -> ms timestamp
const typingOn = new Set()        // channelIds where we last sent typing:true
const KEEPALIVE_MS = 25000

function flushOutbox(channelId, ws) {
  for (const item of outbox.get(channelId) || []) {
    clearTimeout(item.timer)
    ws.send(JSON.stringify(item.payload))
    item.resolve(true)
  }
  outbox.delete(channelId)
  lastSent.set(channelId, Date.now())
}

function failOutbox(channelId) {
  for (const item of outbox.get(channelId) || []) {
    clearTimeout(item.timer)
    item.resolve(false)
  }
  outbox.delete(channelId)
}

function stopTimers(channelId) {
  clearTimeout(reconnectTimers.get(channelId))
  reconnectTimers.delete(channelId)
  clearInterval(keepalives.get(channelId))
  keepalives.delete(channelId)
}

// True when the JWT's `exp` is past (or within 30s). A refused handshake
// carries no reason, so this is the only safe signal that a token refresh
// could help — refreshing on every refusal hammers the refresh endpoint
// and, with rotating refresh tokens, ends in a forced logout.
function tokenExpired(token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !exp || exp * 1000 < Date.now() + 30_000
  } catch {
    return false
  }
}

function unwrap(body, fallback = 'Something went wrong') {
  if (body?.code !== 200) throw new Error(body?.error || body?.response || fallback)
  return body
}

// Every chat call opts out of the interceptor's 403/404 page redirects.
const QUIET = { skipErrorRedirect: true }

const byCreatedAt = (a, b) => new Date(a.created_at) - new Date(b.created_at)

const state = () => ({
  channels:        [],
  channelsLoading: false,

  panelOpen:       false,
  activeChannelId: null,
  // channelId -> { items: [], page, hasMore, loading, total }
  messages:        {},
  // channelId -> [userId, ...] currently typing
  typing:          {},
  // channelIds whose socket is open
  connected:       [],
  // channelIds whose handshake was refused for good (§5: don't retry)
  failed:          [],
})

const getters = {
  channels:        (s) => s.channels,
  channelsLoading: (s) => s.channelsLoading,
  panelOpen:       (s) => s.panelOpen,
  activeChannelId: (s) => s.activeChannelId,
  activeChannel:   (s) => s.channels.find((c) => c.id === s.activeChannelId) || null,
  messagesFor:     (s) => (id) => s.messages[id] || { items: [], page: 0, hasMore: true, loading: false, total: 0 },
  typingFor:       (s) => (id) => s.typing[id] || [],
  isConnected:     (s) => (id) => s.connected.includes(id),
  isFailed:        (s) => (id) => s.failed.includes(id),
  totalUnread:     (s) => s.channels.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  // Everyone you can chat with: active employees (user accounts, so `id`
  // is the chat user id), minus yourself, sorted by name.
  people: (s, g, rs, rootGetters) => {
    const me = rootGetters['auth/user']?.id
    return (rootGetters['employee/employeeList'] || [])
      .filter((e) => e.id !== me && e.is_active !== false)
      .map((e) => ({
        id:    e.id,
        name:  e.full_name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.username || e.email,
        email: e.email,
        photo: personPhoto(e),
      }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  },
  // Chat member payloads carry no photo — resolve it from the employee list
  // (user accounts, keyed by the same user id).
  photoByUser:     (s, g, rs, rootGetters) => {
    const map = {}
    for (const e of rootGetters['employee/employeeList'] || []) {
      const url = personPhoto(e)
      if (url) map[e.id] = url
    }
    return map
  },
}

const mutations = {
  SET_CHANNELS(s, list)        { s.channels = list },
  SET_CHANNELS_LOADING(s, v)   { s.channelsLoading = v },
  SET_ACTIVE(s, id)            { s.activeChannelId = id },
  SET_PANEL_OPEN(s, v)         { s.panelOpen = v },

  UPSERT_CHANNEL(s, channel) {
    const i = s.channels.findIndex((c) => c.id === channel.id)
    if (i === -1) s.channels.unshift(channel)
    else s.channels.splice(i, 1, { ...s.channels[i], ...channel })
  },
  REMOVE_CHANNEL(s, id) {
    s.channels = s.channels.filter((c) => c.id !== id)
    delete s.messages[id]
    if (s.activeChannelId === id) s.activeChannelId = null
  },
  SET_UNREAD(s, { id, count }) {
    const c = s.channels.find((ch) => ch.id === id)
    if (c) c.unread_count = count
  },

  INIT_MESSAGES(s, id) {
    if (!s.messages[id]) s.messages[id] = { items: [], page: 0, hasMore: true, loading: false, total: 0 }
  },
  SET_MESSAGES_LOADING(s, { id, loading }) { s.messages[id].loading = loading },
  PREPEND_PAGE(s, { id, results, page, total, hasMore }) {
    const bucket = s.messages[id]
    const seen = new Set(bucket.items.map((m) => m.id))
    bucket.items = [...results.filter((m) => !seen.has(m.id)), ...bucket.items].sort(byCreatedAt)
    bucket.page = page
    bucket.total = total
    bucket.hasMore = hasMore
  },
  // Newest page re-fetched after a reconnect — fills any gap without
  // touching the pagination cursor.
  MERGE_LATEST(s, { id, results }) {
    const bucket = s.messages[id]
    if (!bucket) return
    const seen = new Set(bucket.items.map((m) => m.id))
    bucket.items = [...bucket.items, ...results.filter((m) => !seen.has(m.id))].sort(byCreatedAt)
  },
  // Live message from the socket. Deduped by id because the server echoes a
  // sender's own message back to every one of their open sockets.
  PUSH_MESSAGE(s, message) {
    const id = message.channel
    if (s.messages[id] && !s.messages[id].items.some((m) => m.id === message.id)) {
      s.messages[id].items.push(message)
    }
    const c = s.channels.find((ch) => ch.id === id)
    if (c) {
      c.last_message = message
      c.updated_at = message.created_at
      s.channels = [c, ...s.channels.filter((ch) => ch.id !== id)]
    }
  },

  SET_TYPING(s, { id, userId, isTyping }) {
    const list = (s.typing[id] || []).filter((u) => u !== userId)
    s.typing[id] = isTyping ? [...list, userId] : list
  },
  SET_CONNECTED(s, { id, connected }) {
    s.connected = connected ? [...new Set([...s.connected, id])] : s.connected.filter((c) => c !== id)
  },
  SET_FAILED(s, { id, failed }) {
    s.failed = failed ? [...new Set([...s.failed, id])] : s.failed.filter((c) => c !== id)
  },
}

const actions = {
  // ── REST ───────────────────────────────────────────────────────────────
  async fetchChannels({ commit }) {
    commit('SET_CHANNELS_LOADING', true)
    try {
      const { data } = await api.get(V1API.chat_channels, QUIET)
      commit('SET_CHANNELS', unwrap(data).data || [])
    } finally {
      commit('SET_CHANNELS_LOADING', false)
    }
  },

  async openIndividual({ commit }, userId) {
    const { data } = await api.post(V1API.chat_channel_individual, { user_id: userId }, QUIET)
    const channel = unwrap(data).data
    commit('UPSERT_CHANNEL', channel)
    return channel
  },

  async createGroup({ commit }, { name, member_ids }) {
    const { data } = await api.post(V1API.chat_channel_group, { name, member_ids }, QUIET)
    const channel = unwrap(data).data
    commit('UPSERT_CHANNEL', channel)
    return channel
  },

  async openProjectChannel({ commit }, projectId) {
    const { data } = await api.get(V1API.chat_channel_project + projectId, QUIET)
    const channel = unwrap(data).data
    commit('UPSERT_CHANNEL', channel)
    return channel
  },

  // Record channel (§2a) — `type` is a RECORD_TYPES key (LEAVE, EOD, …),
  // `recordId` the SMICEE record id. Get-or-create + membership sync, so it
  // must only run on an explicit "Chat" click, never per list row / on load.
  async openRecordChannel({ commit }, { type, recordId }) {
    const def = RECORD_TYPES[type]
    if (!def) throw new Error(`Unknown chat record type: ${type}`)
    const { data } = await api.get(V1API[def.api] + recordId, QUIET)
    const channel = unwrap(data).data
    commit('UPSERT_CHANNEL', channel)
    return channel
  },

  // People picker for "+ new chat" / "Add members" — the employee list
  // (user accounts, so `id` is the user id the chat endpoints expect).
  // Fetched once via the shared employee module, then filtered locally.
  async ensurePeople({ dispatch, rootGetters }) {
    if (!rootGetters['employee/employeeList']?.length) {
      await dispatch('employee/fetchEmployeeList', null, { root: true })
    }
  },

  async searchContacts({ dispatch, getters }, search = '') {
    await dispatch('ensurePeople')
    const q = search.trim().toLowerCase()
    return getters.people.filter((c) => !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
  },

  async addMembers(_, { channelId, member_ids }) {
    const { data } = await api.post(`${V1API.chat_channel}${channelId}/members`, { member_ids }, QUIET)
    return unwrap(data).data
  },

  async removeMember({ commit, rootGetters }, { channelId, userId }) {
    const { data } = await api.delete(`${V1API.chat_channel}${channelId}/members/${userId}`, QUIET)
    unwrap(data)
    if (userId === rootGetters['auth/user']?.id) commit('REMOVE_CHANNEL', channelId)
  },

  // Loads the next (older) page. The endpoint returns the newest page first
  // and doesn't guarantee intra-page order, so PREPEND_PAGE re-sorts.
  async fetchMessages({ commit, state }, { channelId, count = 30 }) {
    commit('INIT_MESSAGES', channelId)
    const bucket = state.messages[channelId]
    if (bucket.loading || !bucket.hasMore) return
    commit('SET_MESSAGES_LOADING', { id: channelId, loading: true })
    try {
      const page = bucket.page + 1
      const { data } = await api.get(`${V1API.chat_channel}${channelId}/messages`, { ...QUIET, params: { count, page } })
      unwrap(data)
      commit('PREPEND_PAGE', {
        id: channelId,
        results: data.results || [],
        page,
        total: data.pg_count || 0,
        hasMore: !!data.next,
      })
    } finally {
      commit('SET_MESSAGES_LOADING', { id: channelId, loading: false })
    }
  },

  async uploadAttachment(_, { channelId, file }) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post(`${V1API.chat_channel}${channelId}/attachments`, form, {
      ...QUIET,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrap(data).data
  },

  async markReadRest({ commit }, channelId) {
    const { data } = await api.post(`${V1API.chat_channel}${channelId}/read`, null, QUIET)
    unwrap(data)
    commit('SET_UNREAD', { id: channelId, count: 0 })
  },

  // ── WebSocket ──────────────────────────────────────────────────────────
  async connect({ commit, dispatch, state, rootGetters }, { channelId, isReconnect = false }) {
    if (sockets.has(channelId)) return
    clearTimeout(reconnectTimers.get(channelId))
    reconnectTimers.delete(channelId)
    commit('SET_FAILED', { id: channelId, failed: false })

    // Refresh first only if the access token really is expired. Failure
    // here is left to the normal REST 401 flow — never log out from chat.
    if (rootGetters['auth/token'] && tokenExpired(rootGetters['auth/token'])) {
      try {
        // Single-flight: concurrent connects share one refresh request.
        refreshing ||= dispatch('auth/refreshToken', null, { root: true }).finally(() => { refreshing = null })
        await refreshing
      } catch {
        failOutbox(channelId)
        return commit('SET_FAILED', { id: channelId, failed: true })
      }
      if (state.activeChannelId !== channelId || sockets.has(channelId)) return
    }
    const token = rootGetters['auth/token']
    if (!token) return

    const ws = new WebSocket(chatSocketUrl(channelId, token))
    sockets.set(channelId, ws)
    let lostMembership = false
    let opened = false

    // Some proxies never answer the upgrade at all — don't leave the UI on
    // "Connecting…" forever; close it so onclose runs the failure path.
    const timeout = setTimeout(() => {
      if (!opened && ws.readyState === WebSocket.CONNECTING) ws.close()
    }, CONNECT_TIMEOUT_MS)

    ws.onopen = () => {
      clearTimeout(timeout)
      opened = true
      reconnectTries.delete(channelId)
      commit('SET_CONNECTED', { id: channelId, connected: true })
      flushOutbox(channelId, ws)
      if (isReconnect) dispatch('backfill', channelId)

      clearInterval(keepalives.get(channelId))
      keepalives.set(channelId, setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN || typingOn.has(channelId)) return
        if (Date.now() - (lastSent.get(channelId) || 0) < KEEPALIVE_MS - 5000) return
        ws.send(JSON.stringify({ event: 'typing', is_typing: false }))
        lastSent.set(channelId, Date.now())
      }, KEEPALIVE_MS))
    }

    ws.onmessage = (e) => {
      let payload
      try { payload = JSON.parse(e.data) } catch { return }
      const me = rootGetters['auth/user']?.id

      if (payload.event === 'message') {
        commit('PUSH_MESSAGE', payload.message)
        commit('SET_TYPING', { id: channelId, userId: payload.message.sender, isTyping: false })
        // Viewing this channel right now → keep it read.
        if (payload.message.sender !== me) dispatch('markRead', channelId)
      } else if (payload.event === 'typing') {
        if (payload.user_id === me) return
        commit('SET_TYPING', { id: channelId, userId: payload.user_id, isTyping: payload.is_typing })
        // Safety net in case the "stopped typing" event never arrives.
        const key = `${channelId}:${payload.user_id}`
        clearTimeout(typingTimers.get(key))
        if (payload.is_typing) {
          typingTimers.set(key, setTimeout(() =>
            commit('SET_TYPING', { id: channelId, userId: payload.user_id, isTyping: false }), 6000))
        }
      } else if (payload.event === 'read') {
        if (payload.user_id === me) commit('SET_UNREAD', { id: channelId, count: 0 })
      } else if (payload.event === 'error') {
        if (payload.error === 'Not a member of this channel') lostMembership = true
        else dispatch('reportSocketError', payload.error)
      }
    }

    ws.onclose = (e) => {
      clearTimeout(timeout)
      // A newer socket for this channel may already have replaced this one.
      if (sockets.get(channelId) !== ws) return
      sockets.delete(channelId)
      clearInterval(keepalives.get(channelId))
      keepalives.delete(channelId)
      commit('SET_CONNECTED', { id: channelId, connected: false })
      // Close code/reason is the only diagnostic for flaky connections.
      console.warn('[chat] socket closed', { channelId, code: e.code, reason: e.reason, opened })

      // Membership revoked -> drop the channel, never reconnect (§5).
      if (lostMembership) {
        failOutbox(channelId)
        return commit('REMOVE_CHANNEL', channelId)
      }
      if (state.activeChannelId !== channelId) return failOutbox(channelId)

      // Dropped, or still re-establishing a connection that worked before:
      // retry with backoff. A first-ever handshake that's refused is final.
      if (opened || isReconnect) {
        const tries = reconnectTries.get(channelId) || 0
        if (tries < BACKOFF_MS.length) {
          reconnectTries.set(channelId, tries + 1)
          reconnectTimers.set(channelId, setTimeout(() => {
            reconnectTimers.delete(channelId)
            if (state.activeChannelId === channelId) dispatch('connect', { channelId, isReconnect: true })
          }, BACKOFF_MS[tries]))
          return
        }
      }

      reconnectTries.delete(channelId)
      failOutbox(channelId)
      commit('SET_FAILED', { id: channelId, failed: true })
    }
  },

  // Tab became visible / network came back: skip any pending backoff and
  // reconnect the conversation on screen right away.
  wake({ state, dispatch }) {
    const id = state.activeChannelId
    if (!id || !state.panelOpen || sockets.has(id)) return
    reconnectTries.delete(id)
    dispatch('connect', { channelId: id, isReconnect: true })
  },

  // Manual retry from the thread's "can't connect" bar.
  retryConnect({ commit, dispatch }, channelId) {
    reconnectTries.delete(channelId)
    commit('SET_FAILED', { id: channelId, failed: false })
    dispatch('connect', { channelId, isReconnect: true })
  },

  async backfill({ commit }, channelId) {
    try {
      const { data } = await api.get(`${V1API.chat_channel}${channelId}/messages`, { ...QUIET, params: { count: 30, page: 1 } })
      unwrap(data)
      commit('MERGE_LATEST', { id: channelId, results: data.results || [] })
    } catch { /* next scroll/open will catch up */ }
  },

  disconnect({ commit }, channelId) {
    const ws = sockets.get(channelId)
    sockets.delete(channelId)   // before close(), so onclose skips the retry
    stopTimers(channelId)
    reconnectTries.delete(channelId)
    typingOn.delete(channelId)
    failOutbox(channelId)
    if (ws) ws.close()
    commit('SET_CONNECTED', { id: channelId, connected: false })
  },

  disconnectAll({ dispatch }) {
    for (const id of [...sockets.keys()]) dispatch('disconnect', id)
  },

  // Sends immediately when open. With `queue`, a payload sent while the
  // socket is (re)connecting waits in the outbox and resolves true once
  // flushed, or false if the connection doesn't come back in time.
  send({ state, dispatch }, { channelId, payload, queue = false }) {
    const ws = sockets.get(channelId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
      lastSent.set(channelId, Date.now())
      return true
    }
    if (!queue || state.activeChannelId !== channelId || state.failed.includes(channelId)) return false
    if (!sockets.has(channelId) && !reconnectTimers.has(channelId)) {
      dispatch('connect', { channelId, isReconnect: true })
    }
    return new Promise((resolve) => {
      const item = { payload, resolve }
      item.timer = setTimeout(() => {
        outbox.set(channelId, (outbox.get(channelId) || []).filter((i) => i !== item))
        resolve(false)
      }, OUTBOX_TIMEOUT_MS)
      outbox.set(channelId, [...(outbox.get(channelId) || []), item])
    })
  },

  // Text and/or attachments as one send. The API allows `content` alongside
  // an `attachment_id`, so the text rides on the first attachment's message;
  // further attachments go as their own messages. `files` items are
  // { file, attachmentId?, sent? } -- filled in as they progress, so a failed
  // send can be retried without re-uploading or re-sending what went out.
  async sendMessage({ dispatch }, { channelId, content = '', files = [] }) {
    const text = content.trim()
    if (!files.length) {
      return dispatch('send', { channelId, queue: true, payload: { event: 'message', content: text } })
    }
    for (const item of files) {
      if (!item.attachmentId) {
        const attachment = await dispatch('uploadAttachment', { channelId, file: item.file })
        item.attachmentId = attachment.id
      }
    }
    let textSent = false
    for (const item of files) {
      if (item.sent) { textSent = true; continue }
      const payload = {
        event: 'message',
        attachment_id: item.attachmentId,
        message_type: item.file.type?.startsWith('image/') ? 'IMAGE' : 'FILE',
      }
      if (!textSent && text) payload.content = text
      const ok = await dispatch('send', { channelId, queue: true, payload })
      if (!ok) return false
      item.sent = true
      textSent = true
    }
    return true
  },

  sendTyping({ dispatch }, { channelId, isTyping }) {
    isTyping ? typingOn.add(channelId) : typingOn.delete(channelId)
    return dispatch('send', { channelId, payload: { event: 'typing', is_typing: isTyping } })
  },

  // WS `read` is the primary path; REST is the fallback when not connected.
  async markRead({ commit, dispatch }, channelId) {
    commit('SET_UNREAD', { id: channelId, count: 0 })
    const sent = await dispatch('send', { channelId, payload: { event: 'read' } })
    if (!sent) await dispatch('markReadRest', channelId).catch(() => {})
  },

  // ── Panel / selection ──────────────────────────────────────────────────
  // One live socket at a time: the conversation on screen.
  async selectChannel({ commit, dispatch, state }, id) {
    const prev = state.activeChannelId
    if (prev === id) return
    if (prev) dispatch('disconnect', prev)
    commit('SET_ACTIVE', id)
    if (!id) return

    // Project membership is derived from the project team — re-sync it on
    // every open rather than trusting the cached list (§3). A deleted
    // project's channel is hidden and answers 400 (P3): drop it.
    const channel = state.channels.find((c) => c.id === id)
    // Record channels (§2a) are derived the same way from the record's
    // requester / referees / approver; a deleted record hides its channel.
    const resync = channel?.channel_type === 'PROJECT' && channel.project
      ? ['openProjectChannel', channel.project, 'This project chat is no longer available.']
      : isRecordChannel(channel) && channel.record?.id
        ? ['openRecordChannel', { type: channel.channel_type, recordId: channel.record.id }, 'This chat is no longer available.']
        : null
    if (resync) {
      try {
        await dispatch(resync[0], resync[1])
      } catch (e) {
        commit('REMOVE_CHANNEL', id)
        dispatch('reportSocketError', e.message || resync[2])
        return
      }
      if (state.activeChannelId !== id) return
    }

    dispatch('connect', { channelId: id })
    dispatch('markRead', id)
  },

  async openPanel({ commit, dispatch, state, rootGetters }, channelId = null) {
    if (!state.panelOpen && !rootGetters['sidebar/collapsed']) {
      sidebarCollapsedByChat = true
      dispatch('sidebar/collapse', null, { root: true })
    }
    commit('SET_PANEL_OPEN', true)
    dispatch('fetchChannels').catch(() => {})
    dispatch('ensurePeople').catch(() => {})
    if (channelId) await dispatch('selectChannel', channelId)
  },

  closePanel({ commit, dispatch }) {
    if (sidebarCollapsedByChat) {
      sidebarCollapsedByChat = false
      dispatch('sidebar/expand', null, { root: true })
    }
    commit('SET_PANEL_OPEN', false)
    dispatch('disconnectAll')
    commit('SET_ACTIVE', null)
  },

  // Get-or-create the 1:1 with a person, then show it (idempotent server-side).
  async openDirect({ dispatch }, userId) {
    const channel = await dispatch('openIndividual', userId)
    await dispatch('selectChannel', channel.id)
    return channel
  },

  // Entry point for project pages: get-or-create + sync, then show it.
  async openProjectChat({ dispatch }, projectId) {
    const channel = await dispatch('openProjectChannel', projectId)
    await dispatch('openPanel')
    await dispatch('selectChannel', channel.id)
    return channel
  },

  // Hook for the UI to subscribe to (via store.subscribeAction) for toasts.
  reportSocketError() {},
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
