import api    from '@/plugins/axios'
import V1API  from '@/utils/apiPaths'
import { apiErrorMessage, bodyErrorMessage } from '@/utils/helpers'

const TOKEN_KEY       = 'admin_token'
const REFRESH_KEY     = 'admin_refresh_token'
const PERMISSIONS_KEY = 'permissions'

const state = () => ({
  token:        localStorage.getItem(TOKEN_KEY)   || null,
  refreshToken: localStorage.getItem(REFRESH_KEY) || null,
  user:         JSON.parse(localStorage.getItem('user') || 'null'),
  loading:      false,
  error:        null,
})

const getters = {
  isAuthenticated: (state) => !!state.token,
  token:           (state) => state.token,
  user:            (state) => state.user,
  loading:         (state) => state.loading,
  error:           (state) => state.error,
  userRoles:       (state) => state.user?.roles       ?? [],
  userPermissions: (state) => state.user?.permissions ?? [],
}

const mutations = {
  SET_TOKEN(state, { token, refreshToken }) {
    state.token        = token
    state.refreshToken = refreshToken
    localStorage.setItem(TOKEN_KEY,   token)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },

  SET_USER(state, user) {
    state.user = user
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(user?.permissions ?? []))
  },

  // Merges partial fields (e.g. a freshly-uploaded photo) into the existing
  // user without waiting for the next login's user_object to bring it in —
  // profile edits happen through the `employee` module, which never touches
  // this module's state on its own.
  PATCH_USER(state, partial) {
    state.user = { ...state.user, ...partial }
    localStorage.setItem('user', JSON.stringify(state.user))
  },

  SET_LOADING(state, value) {
    state.loading = value
  },

  SET_ERROR(state, message) {
    state.error = message
  },

  CLEAR_AUTH(state) {
    state.token        = null
    state.refreshToken = null
    state.user         = null
    state.error        = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem('user')
    localStorage.removeItem(PERMISSIONS_KEY)
  },
}

const actions = {
  // Real SMICEE login — POSTs to V1API.getAccessToken and stores the
  // access/refresh tokens plus the flat `permissions` string array the
  // backend returns alongside `user_object`.
  //
  // Bad credentials can come back as an in-body failure (`{ code: 401,
  // status_code: 401, message: 'No active account found with the given
  // credentials', errors: [...] }`) on an HTTP 200, so axios resolves and the
  // outer status looks fine. Check the body itself before trusting the
  // payload, otherwise `access_token` is `undefined` and we'd "log in" with a
  // literal "undefined" token instead of showing the server's message.
  async login({ commit, dispatch }, { email, password }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const { data } = await api.post(V1API.getAccessToken, { email, password })

      const bodyError = bodyErrorMessage(data)
      if (bodyError) throw new Error(bodyError)
      if (!data?.access_token) {
        throw new Error('Login failed. Please check your credentials and try again.')
      }

      commit('SET_TOKEN', {
        token:        data.access_token,
        refreshToken: data.refresh_token,
      })
      commit('SET_USER', {
        ...data.user_object,
        name:         data.user_object?.full_name || data.user_object?.username,
        is_employee:  data.is_employee,
        is_vendor:    data.is_vendor,
        is_candidate: data.is_candidate,
        permissions:  data.permissions ?? [],
        roles:        [],
      })
      await dispatch('permission/fetchPermissions', null, { root: true })
      return data
    } catch (err) {
      const message = apiErrorMessage(err, 'Login failed. Please check your credentials and try again.')
      commit('SET_ERROR', message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async register({ commit, dispatch }, payload) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const { data } = await api.post('/auth/register', payload)

      const bodyError = bodyErrorMessage(data)
      if (bodyError) throw new Error(bodyError)

      commit('SET_TOKEN', {
        token:        data.access_token,
        refreshToken: data.refresh_token,
      })
      commit('SET_USER', data.user_object ?? data.user ?? data)
      await dispatch('permission/fetchPermissions', null, { root: true })
      return data
    } catch (err) {
      const message = apiErrorMessage(err, 'Registration failed. Please try again.')
      commit('SET_ERROR', message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Confirms the stored access token is still valid — mirrors the legacy
  // `verifyLogin` call made on every protected-route navigation.
  // This endpoint reports failure (e.g. `status_code: 401`) inside a 200
  // response body instead of an actual HTTP error status, so a successful
  // axios call isn't enough — `bodyErrorMessage` checks the body's own
  // status, and only treats it as a failure when an error status (>= 400) is
  // explicitly present: requiring an exact match on a guessed success shape
  // (e.g. `status_code === 200`) risks logging every user straight back out
  // right after login.
  async verifyToken({ state, commit }) {
    if (!state.token) throw new Error('No token to verify')
    try {
      const { data } = await api.post(V1API.verifyLogin, { access_token: state.token })
      const bodyError = bodyErrorMessage(data)
      if (bodyError) throw new Error(bodyError)
      return true
    } catch (err) {
      commit('CLEAR_AUTH')
      throw err
    }
  },

  async refreshToken({ state, commit }) {
    if (!state.refreshToken) throw new Error('No refresh token available')
    const { data } = await api.post(V1API.refreshAccessToken, {
      refresh: state.refreshToken,
    })
    // Like login, a failed refresh can arrive as an HTTP 200 with an error
    // body — never persist a missing token as the string "undefined".
    const access = data?.access_token ?? data?.access
    if (!access) throw new Error(bodyErrorMessage(data) || 'Token refresh failed')
    commit('SET_TOKEN', {
      token:        access,
      refreshToken: data.refresh_token ?? data.refresh ?? state.refreshToken,
    })
  },

  async logout({ commit }) {
    commit('CLEAR_AUTH')
    commit('permission/CLEAR_PERMISSIONS', null, { root: true })
  },

  async updateProfile({ commit }, payload) {
    const { data } = await api.put(V1API.update_employee_information, payload)
    commit('SET_USER', data.user ?? data)
    return data
  },

  // Change password while logged in. The forgot-password flow (email check,
  // OTP verify, reset) lives in the dedicated `resetPassword` store module.
  async changePassword(_, payload) {
    const { data } = await api.post(V1API.update_password, payload)
    return data
  },

  clearError({ commit }) {
    commit('SET_ERROR', null)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
