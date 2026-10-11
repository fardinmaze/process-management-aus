// Shared by Navbar.vue's dropdown and the full Notifications.vue page —
// resolves a normalized notification row (store/notification.js) to the
// router location for its `type`/`payload`. `payload` is that record's own
// id, as a string; each destination is the "my own item" details page,
// since every notification is about something addressed to the current user.
const NOTIFICATION_ROUTE = {
  project:     (id) => ({ name: 'ProjectDetails',       params: { id } }),
  eod:         (id) => ({ name: 'MyEodDetails',         params: { id } }),
}

// Needs the Vuex store to resolve `task` notifications, whose payload is the
// task id, not a project id — ProjectDetails is keyed by project id, so this
// looks the task up first to get its parent project, then deep-links in via
// ?openTask (see ProjectDetails.vue's created() hook).
export async function resolveNotificationRoute(n, store) {
  if (!n?.payload) return null

  if (n.type === 'task') {
    const res = await store.dispatch('task/fetchTaskDetails', n.payload)
    const projectId = res?.data?.project
    if (!projectId) return null
    return { name: 'ProjectDetails', params: { id: projectId }, query: { openTask: n.payload } }
  }

  const buildRoute = NOTIFICATION_ROUTE[n.type]
  return buildRoute ? buildRoute(n.payload) : null
}
