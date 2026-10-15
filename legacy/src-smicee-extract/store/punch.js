// Ported from the legacy SMICEE frontend's `punch.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  timeSheetLatest:        {},
  timeSheetSummary:       [],
  timeSheetSummaryCount:  null,
  attendances:            [],
  attendanceCount:        null,
  workSheetSummary:       [],
  detailTimeSheetSummary: [],
  userInfo:               {},

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  timeSheetLatest:        (state) => state.timeSheetLatest,
  timeSheetSummary:       (state) => state.timeSheetSummary,
  timeSheetSummaryCount:  (state) => state.timeSheetSummaryCount,
  attendances:            (state) => state.attendances,
  attendanceCount:        (state) => state.attendanceCount,
  workSheetSummary:       (state) => state.workSheetSummary,
  detailTimeSheetSummary: (state) => state.detailTimeSheetSummary,
  userInfo:               (state) => state.userInfo,
  submitLoading:          (state) => state.submitLoading,
  submitError:            (state) => state.submitError,
}

const mutations = {
  SET_LATEST_TIME_SHEET(state, timeSheet) {
    state.timeSheetLatest = timeSheet
  },
  SET_TIME_SHEET_SUMMARY(state, { results, pg_count }) {
    state.timeSheetSummary      = results
    state.timeSheetSummaryCount = pg_count
  },
  SET_EMPLOYEE_ATTENDANCES(state, { results, count }) {
    state.attendances     = results
    state.attendanceCount = count
  },
  SET_WORK_TIME_SHEET_SUMMARY(state, { data, user_info }) {
    state.workSheetSummary = data
    state.userInfo          = user_info
  },
  SET_DETAIL_TIME_SHEET_SUMMARY(state, { data, user_info }) {
    state.detailTimeSheetSummary = data
    state.userInfo                = user_info
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
  async addAttende({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.employee_punch, { location: payload })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchLatestTimeSheet')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchLatestTimeSheet({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.latest_timesheet)
      commit('SET_LATEST_TIME_SHEET', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchTimeSheetSummary({ commit }, payload = {}) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.search_term) params.append('search_term', payload.search_term)
      if (payload.status_param)      params.append('status_param', payload.status_param)
      if (payload.department)  params.append('department', payload.department)
      if (payload.designation) params.append('designation', payload.designation)
      if (payload.employee)    params.append('employee', payload.employee)

      const url = V1API.time_sheet_summary + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_TIME_SHEET_SUMMARY', { results, pg_count })
      return result
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchAttendances({ commit }, payload = {}) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.month)  params.append('month', payload.month)
      if (payload.year)    params.append('year', payload.year)

      const url = V1API.fetch_attendances + '?' + params.toString()
      const result = await api.get(url)
      const { results, count } = result.data
      commit('SET_EMPLOYEE_ATTENDANCES', { results, count })
      return result
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchWorkTimeSheetById({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.work_history_time_sheet_by_id}${payload}`)
      commit('SET_WORK_TIME_SHEET_SUMMARY', data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchDetailsTimeSheetByDateId({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.details_time_sheet_by_date_and_id}${payload.id}/${payload.date}`)
      commit('SET_DETAIL_TIME_SHEET_SUMMARY', data)
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
