// Ported from the legacy SMICEE frontend's `activityLog.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
// `deleteActivity` was also dropped: it called `V1API.delete_activity`, which
// isn't in this project's ported endpoint map (activity log is read-only there).
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  activity:      [],
  activityCount: null,

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  activity:      (state) => state.activity,
  activityCount: (state) => state.activityCount,
  submitLoading: (state) => state.submitLoading,
  submitError:   (state) => state.submitError,
}

const mutations = {
  SET_ACTIVITY(state, { results, pg_count }) {
    state.activity      = results
    state.activityCount = pg_count
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
  async fetchActivity({ commit }, payload = {}) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.start_date)  params.append('start_date', payload.start_date)
      if (payload.end_date)    params.append('end_date', payload.end_date)
      if (payload.status)      params.append('status', payload.status)
      if (payload.search_term) params.append('search_term', payload.search_term)
      if (payload.raised_by)   params.append('raised_by', payload.raised_by)

      const url = V1API.get_activity_log + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_ACTIVITY', { results, pg_count })
      return result
    } catch {
      commit('SUBMIT_ERROR', true)
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
