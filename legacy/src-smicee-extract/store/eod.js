// Ported from the legacy SMICEE frontend's `eod.js` store module. Dropped:
// raw axios + manually-attached Bearer header (the `api` instance already
// injects it), the `dataMagic` encode/decode step, and the `asyncHelper`
// boilerplate generator — none of which exist in this project. The ticket-
// related actions that lived in the legacy file (fetchTicket, updateTicket,
// etc.) were dead code there (they committed mutations — SET_TICKET,
// SET_MY_TICKET, etc. — that the module never defined) and belong in the
// dedicated `ticket` store module instead, so they're omitted here.
import api   from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  myDraft:  {},
  myEod:    [],
  allEod:   [],
  eodDetail: {},
  eodSheet: [],
  sheetCount: null,

  myCompleteTickets: [],
  myCompleteTask:    [],

  eodReply: [],

  eodLoading: false,
  eodError:   false,

  eodReplyLoading: false,
  eodReplyError:   false,

  eodReferLoading: false,
  eodReferError:   false,

  eodSuccess: false,

  count:       null,
  allEodCount: null,
})

const getters = {
  myDraft:           (state) => state.myDraft,
  myEod:             (state) => state.myEod,
  allEod:            (state) => state.allEod,
  eodDetail:         (state) => state.eodDetail,
  eodSheet:          (state) => state.eodSheet,
  sheetCount:        (state) => state.sheetCount,
  myCompleteTickets: (state) => state.myCompleteTickets,
  myCompleteTask:    (state) => state.myCompleteTask,
  eodReply:          (state) => state.eodReply,
  eodLoading:        (state) => state.eodLoading,
  eodError:          (state) => state.eodError,
  eodReplyLoading:   (state) => state.eodReplyLoading,
  eodReplyError:     (state) => state.eodReplyError,
  eodReferLoading:   (state) => state.eodReferLoading,
  eodReferError:     (state) => state.eodReferError,
  count:             (state) => state.count,
  allEodCount:       (state) => state.allEodCount,
}

const mutations = {
  SET_MY_COMPLETE(state, { tickets, tasks }) {
    state.myCompleteTask    = tasks
    state.myCompleteTickets = tickets
  },

  SET_MY_DRAFT(state, draft) {
    state.myDraft = draft
  },

  SET_EOD_DETAIL(state, eod) {
    state.eodDetail = eod
  },

  SET_MY_EOD(state, { results, count }) {
    state.myEod = results
    state.count = count
  },

  SET_ALL_EOD(state, { results, pg_count }) {
    state.allEod    = results
    state.allEodCount = pg_count
  },

  SET_EOD_SHEET(state, { results, count }) {
    state.eodSheet   = results
    state.sheetCount = count
  },

  SET_EOD_REPLY(state, reply) {
    state.eodReply = reply
  },

  EOD_LOADING(state, loading) {
    state.eodLoading = loading
  },

  EOD_ERROR(state, hasError) {
    state.eodError = hasError
  },

  EOD_REPLY_LOADING(state, loading) {
    state.eodReplyLoading = loading
  },

  EOD_REPLY_ERROR(state, hasError) {
    state.eodReplyError = hasError
  },

  EOD_REFER_LOADING(state, loading) {
    state.eodReferLoading = loading
  },

  EOD_REFER_ERROR(state, hasError) {
    state.eodReferError = hasError
  },

  EOD_SUBMIT_SUCCESS(state, success) {
    state.eodSuccess = success
  },
}

const actions = {
  async addEOD({ commit }, payload) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const { data } = await api.post(V1API.eod_create, payload)
      commit('EOD_SUBMIT_SUCCESS', true)
      return data
    } catch (e) {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
    }
  },

  async addEODDraft({ commit, dispatch }, payload) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const { data } = await api.post(V1API.eod_draft_create, payload)
      commit('EOD_SUBMIT_SUCCESS', true)
      dispatch('fetchMyDraft')
      return data
    } catch (e) {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
    }
  },

  async fetchMyDraft({ commit }) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_my_draft)
      commit('SET_MY_DRAFT', data.data)
    } catch {
      commit('EOD_ERROR', true)
    }
    commit('EOD_LOADING', false)
  },

  async fetchEODCompleteTask({ commit }) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const { data } = await api.get(V1API.eod_completed_task_tickets)
      const { tickets, tasks } = data.data
      commit('SET_MY_COMPLETE', { tickets, tasks })
    } catch {
      commit('EOD_ERROR', true)
    }
    commit('EOD_LOADING', false)
  },

  async updateEODDraft({ commit, dispatch }, payload) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const { data } = await api.patch(`${V1API.eod_draft_edit}${payload.id}`, { report: payload.report })
      dispatch('fetchMyDraft')
      return data
    } catch (e) {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
    }
  },

  async deleteEODDraft({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.eod_draft_delete}${payload.id}`)
    dispatch('fetchMyDraft')
    return data
  },

  async deleteEOD({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.eod_delete}${payload.delete}`)
    dispatch('fetchAllEOD', {
      currentPage: payload.page, perPage: payload.perPage,
      start_date: payload.start_date, end_date: payload.end_date,
      status: payload.status, reported_by: payload.reported_by,
    })
    return data
  },

  async fetchMyEOD({ commit }, payload = {}) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.start_date)  params.append('start_date', payload.start_date)
      if (payload.end_date)    params.append('end_date', payload.end_date)
      if (payload.status)      params.append('status', payload.status)
      if (payload.search_term) params.append('search_term', payload.search_term)

      const url = V1API.get_my_eod_list + '?' + params.toString()
      const result = await api.get(url)
      const { results, count } = result.data
      commit('SET_MY_EOD', { results, count })
      return result
    } catch {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
    }
  },

  async fetchAllEOD({ commit }, payload = {}) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.start_date)  params.append('start_date', payload.start_date)
      if (payload.end_date)    params.append('end_date', payload.end_date)
      if (payload.status)      params.append('status', payload.status)
      if (payload.reported_by) params.append('reported_by', payload.reported_by)

      const url = V1API.get_all_eod + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_ALL_EOD', { results, pg_count })
      return result
    } catch {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
    }
  },

  async fetchEODSheet({ commit }, payload = {}) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.month)  params.append('month', payload.month)
      if (payload.year)    params.append('year', payload.year)

      const url = V1API.get_eod_sheet + '?' + params.toString()
      const result = await api.get(url)
      const { results, count } = result.data
      commit('SET_EOD_SHEET', { results, count })
      return result
    } catch {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
    }
  },

  async fetchEODtDetail({ commit }, payload) {
    commit('EOD_LOADING', true)
    commit('EOD_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_eod_details}${payload}`)
      commit('SET_EOD_DETAIL', data.data)
    } catch {
      commit('EOD_ERROR', true)
    }
    commit('EOD_LOADING', false)
  },

  async addEODReply({ commit, dispatch }, payload) {
    commit('EOD_REPLY_LOADING', true)
    commit('EOD_REPLY_ERROR', false)
    try {
      const { data } = await api.post(V1API.add_eod_reply, { eod: payload.eod, reply: payload.reply })
      commit('EOD_SUBMIT_SUCCESS', true)
      dispatch('fetchEODReply', payload.eod)
      return data
    } catch (e) {
      commit('EOD_REPLY_ERROR', true)
    } finally {
      commit('EOD_REPLY_LOADING', false)
    }
  },

  async fetchEODReply({ commit }, payload) {
    commit('EOD_REPLY_LOADING', true)
    commit('EOD_REPLY_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_reply_of_eod}${payload}`)
      commit('SET_EOD_REPLY', data.data)
    } catch {
      commit('EOD_REPLY_ERROR', true)
    } finally {
      commit('EOD_REPLY_LOADING', false)
    }
  },

  async EODAddRefer({ commit, dispatch }, payload) {
    commit('EOD_REFER_LOADING', true)
    commit('EOD_REFER_ERROR', false)
    try {
      const { data } = await api.post(`${V1API.eod_add_refer}${payload.id}`, { refer_id: payload.refer_id })

      if (payload.myEOD) {
        dispatch('fetchMyEOD', { currentPage: payload.page, perPage: payload.perPage, status: payload.status })
      } else if (payload.detail) {
        dispatch('fetchEODtDetail', payload.id)
      } else if (payload.alleod) {
        dispatch('fetchAllEOD', { currentPage: payload.page, perPage: payload.perPage, status: payload.status, reported_by: payload.reported_by })
      }
      return data
    } catch (e) {
      commit('EOD_REFER_ERROR', true)
    } finally {
      commit('EOD_REFER_LOADING', false)
    }
  },

  async EODDeleteRefer({ commit, dispatch }, payload) {
    commit('EOD_REFER_LOADING', true)
    commit('EOD_REFER_ERROR', false)
    try {
      const { data } = await api.post(`${V1API.eod_delete_refer}${payload.id}`, { refer_id: payload.refer_id })

      if (payload.myEOD) {
        dispatch('fetchMyEOD', { currentPage: payload.page, perPage: payload.perPage, status: payload.status })
      } else if (payload.detail) {
        dispatch('fetchEODtDetail', payload.id)
      } else if (payload.alleod) {
        dispatch('fetchAllEOD', { currentPage: payload.page, perPage: payload.perPage, status: payload.status, reported_by: payload.reported_by })
      }
      return data
    } catch (e) {
      commit('EOD_REFER_ERROR', true)
    } finally {
      commit('EOD_REFER_LOADING', false)
    }
  },

  async updateEODStatus({ commit, dispatch }, payload) {
    try {
      const { data } = await api.get(`${V1API.edit_eod_status}${payload.id}/${payload.status_for_change}`)

      if (payload.from_all) {
        dispatch('fetchAllEOD', {
          currentPage: payload.page, perPage: payload.perPage,
          start_date: payload.start_date, end_date: payload.end_date,
          status: payload.status, reported_by: payload.reported_by,
        })
      } else {
        dispatch('fetchEODtDetail', payload.id)
      }
      return data
    } catch (e) {
      commit('EOD_ERROR', true)
    } finally {
      commit('EOD_LOADING', false)
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
