import api from '@/plugins/axios'

const state = () => ({
  permissions: [],   // flat list of permission strings, e.g. ['user.view', 'role.create']
  roles:       [],   // role names the user holds, e.g. ['admin', 'manager']
  loading:     false,
})

const getters = {
  allPermissions: (state) => state.permissions,
  allRoles:       (state) => state.roles,
  loading:        (state) => state.loading,

  // Real Django superuser bypass. `roles.includes('super-admin')` is kept as
  // a fallback for whatever future auth response might populate `roles`, but
  // it never fires today — login never returns a `roles` field, so this
  // `is_superuser` read (now present on `auth/user` post-login, see
  // authentication/serializer.py's UserInfoSerializer) is the only signal
  // that's actually reachable, and mirrors the backend's own
  // `is_superuser`-bypasses-everything convention (dashboard_summary/views.py,
  // finance/fin_core/dispatcher.py) so frontend and backend never disagree
  // about who "sees everything".
  isSuperAdmin: (state, getters, rootState, rootGetters) =>
    !!rootGetters['auth/user']?.is_superuser || state.roles.includes('super-admin'),

  // Single permission check
  hasPermission: (state, getters) => (permission) => {
    if (getters.isSuperAdmin) return true
    return state.permissions.includes(permission)
  },

  // All-of check  — user must hold every listed permission
  hasAllPermissions: (state, getters) => (list) => {
    if (getters.isSuperAdmin) return true
    return list.every((p) => state.permissions.includes(p))
  },

  // Any-of check  — user must hold at least one listed permission
  hasAnyPermission: (state, getters) => (list) => {
    if (getters.isSuperAdmin) return true
    return list.some((p) => state.permissions.includes(p))
  },

  // Role checks
  hasRole: (state) => (role) => state.roles.includes(role),
  hasAnyRole: (state) => (list) => list.some((r) => state.roles.includes(r)),
}

const mutations = {
  SET_PERMISSIONS(state, { permissions, roles }) {
    state.permissions = permissions
    state.roles       = roles
  },

  SET_LOADING(state, value) {
    state.loading = value
  },

  CLEAR_PERMISSIONS(state) {
    state.permissions = []
    state.roles       = []
  },
}

const actions = {
  async fetchPermissions({ commit, rootGetters }) {
    const user = rootGetters['auth/user']

    // Derive flat permission strings and role names from the user object
    // Works with both Spatie-style { roles: [{name, permissions:[]}] }
    // and flat { roles: [], permissions: [] } responses.
    if (user) {
      const roles = (user.roles ?? []).map((r) =>
        typeof r === 'string' ? r : r.name
      )

      let permissions = []

      if (Array.isArray(user.permissions)) {
        permissions = user.permissions.map((p) =>
          typeof p === 'string' ? p : p.name
        )
      }

      // Also collect permissions embedded in role objects
      if (Array.isArray(user.roles)) {
        user.roles.forEach((role) => {
          if (Array.isArray(role.permissions)) {
            role.permissions.forEach((p) => {
              const name = typeof p === 'string' ? p : p.name
              if (!permissions.includes(name)) permissions.push(name)
            })
          }
        })
      }

      commit('SET_PERMISSIONS', { permissions, roles })
      return
    }

    // Fallback: fetch directly from API
    commit('SET_LOADING', true)
    try {
      const { data } = await api.get('/auth/permissions')
      commit('SET_PERMISSIONS', {
        permissions: data.permissions ?? [],
        roles:       data.roles       ?? [],
      })
    } finally {
      commit('SET_LOADING', false)
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
