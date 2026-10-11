// Ported from the legacy SMICEE frontend's `resetPassword.js` store module.
// The original used raw axios + a manually-attached Bearer header read from
// `localStorage.getItem('access_token')` (a key this project never sets) and
// routed every response through a `dataMagic` encode/decode step and an
// `asyncHelper` boilerplate generator — neither of which exist in this
// project. Both are dropped here: `api` (the shared axios instance) already
// attaches the bearer token via its request interceptor, and the backend
// responses are read as plain JSON.
import api   from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

// This API reports failures (bad OTP, unknown user, ...) as HTTP 200 with
// `code: 400`/`error` in the body rather than a non-2xx status, so axios
// resolves instead of rejecting and a bare try/catch never sees them.
// `assertOk` promotes those into a thrown error shaped like an axios error
// (`err.response.data.message`), matching the `err.response?.data?.message`
// convention used by the views that dispatch these actions.
function assertOk(data) {
  if (data && data.code >= 400) {
    const message = data.error || data.response || 'Request failed'
    const err = new Error(message)
    err.response = { data: { message, ...data } }
    throw err
  }
  return data
}

const state = () => ({
  otpList:       [],
  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  otpList:       (state) => state.otpList,
  submitLoading: (state) => state.submitLoading,
  submitError:   (state) => state.submitError,
  submitSuccess: (state) => state.submitSuccess,
}

const mutations = {
  SET_OTP_LIST(state, otps) {
    state.otpList = otps
  },
  SUBMIT_LOADING(state, loading) {
    state.submitLoading = loading
  },
  SUBMIT_ERROR(state, hasError) {
    state.submitError = hasError
  },
  SUBMIT_SUCCESS(state, success) {
    state.submitSuccess = success
  },
}

const actions = {
  async fetchOtps({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.otp_list)
      commit('SET_OTP_LIST', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Step 1 of the forgot-password flow: confirm the email belongs to a
  // known account. Resolves with the backend's payload (expected to carry
  // the `user` id needed by verifyOtp below), or throws on failure.
  async emailCheck({ commit }, email) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.email_check, { email })
      assertOk(data)
      commit('SUBMIT_SUCCESS', true)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Step 2: confirm the OTP sent to that email. `user` is the id returned
  // by emailCheck.
  async verifyOTP({ commit }, { otp, user }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.verify_otp, { otp, user })
      assertOk(data)
      commit('SUBMIT_SUCCESS', true)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Step 3: set a new password using the verified email/OTP.
  async resetPassword({ commit }, { email, new_password, new_password2 }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.reset_password, { email, new_password, new_password2 })
      assertOk(data)
      commit('SUBMIT_SUCCESS', true)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Change password while logged in.
  async updatePassword({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.update_password, payload)
      assertOk(data)
      commit('SUBMIT_SUCCESS', true)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
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
