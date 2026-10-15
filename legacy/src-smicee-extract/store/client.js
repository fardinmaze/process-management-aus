// Ported from the legacy SMICEE frontend's `client.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
// `updateProject` was also dropped: it called `V1API.area_edit`, a stray
// copy-paste leftover unrelated to this module — no such endpoint exists.
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  company:          [],
  companyPaginated: [],
  companyCount:     null,
  companyStats:     {},
  companyDetails:   {},

  opportunities:  [],
  dealroom:       [],
  dealroomStats:  {},

  client:          [],
  clientWithoutPg: [],
  clientByCompany: [],
  clientCount:     null,
  clientDetails:   {},

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  company:          (state) => state.company,
  companyPaginated: (state) => state.companyPaginated,
  companyCount:     (state) => state.companyCount,
  companyStats:     (state) => state.companyStats,
  companyDetails:   (state) => state.companyDetails,
  opportunities:    (state) => state.opportunities,
  dealroom:         (state) => state.dealroom,
  dealroomStats:    (state) => state.dealroomStats,
  client:           (state) => state.client,
  clientWithoutPg:  (state) => state.clientWithoutPg,
  clientByCompany:  (state) => state.clientByCompany,
  clientCount:      (state) => state.clientCount,
  clientDetails:    (state) => state.clientDetails,
  submitLoading:    (state) => state.submitLoading,
  submitError:      (state) => state.submitError,
}

const mutations = {
  SET_OPPORTUNITY_KANBAN(state, opportunities) {
    state.opportunities = opportunities
  },
  SET_DEALROOM_STATS(state, stats) {
    state.dealroomStats = stats
  },
  SET_DEALROOM_KANBAN(state, dealroom) {
    state.dealroom = dealroom
  },
  SET_COMPANY(state, company) {
    state.company = company
  },
  SET_COMPANY_STATS(state, stats) {
    state.companyStats = stats
  },
  SET_COMPANY_PAGINATED(state, { results, pg_count }) {
    state.companyPaginated = results
    state.companyCount     = pg_count
  },
  SET_CLIENT(state, { results, pg_count }) {
    state.client      = results
    state.clientCount = pg_count
  },
  SET_CLIENT_WITHOUT_PG(state, results) {
    state.clientWithoutPg = results
  },
  SET_CLIENT_BY_COMPANY(state, results) {
    state.clientByCompany = results
  },
  SET_CLIENT_DETAILS(state, details) {
    state.clientDetails = details
  },
  SET_COMPANY_DETAILS(state, details) {
    state.companyDetails = details
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
  async fetchOpportunityKanban({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_opportunity_kanban)
      commit('SET_OPPORTUNITY_KANBAN', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchDealRoomKanban({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_dealroom_kanban)
      commit('SET_DEALROOM_KANBAN', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchDealRoomStats({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_dealroom_stats)
      commit('SET_DEALROOM_STATS', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchCompany({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_company)
      commit('SET_COMPANY', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchCompanyStats({ commit }) {
    try {
      const { data } = await api.get(V1API.get_company_stats)
      commit('SET_COMPANY_STATS', data.data)
    } catch {
      // legacy behavior: errors here were silently swallowed
    }
  },

  async fetchCompanyPaginated({ commit }, payload = {}) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.search_term) params.append('search_term', payload.search_term)

      const url = V1API.get_company_paginated + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_COMPANY_PAGINATED', { results, pg_count })
      return result
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addCompany({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_company, payload.company)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchCompanyPaginated', { perPage: payload.perPage, currentPage: payload.page, search_term: payload.search_term })
      dispatch('fetchCompany')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async updateCompany({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.edit_company}${payload.id}`, payload.company)
    dispatch('fetchCompanyPaginated', { perPage: payload.perPage, currentPage: payload.page, search_term: payload.search_term })
    return data
  },

  async deleteCompany({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_company}${payload.item}`)
    dispatch('fetchCompanyPaginated', { perPage: payload.perPage, currentPage: payload.page, search_term: payload.search_term })
    return data
  },

  async fetchCompanyDetails({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.company_details}${payload}`)
      commit('SET_COMPANY_DETAILS', data.data)
      return data
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchClient({ commit }, payload = {}) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.search_term) params.append('search_term', payload.search_term)
      if (payload.status)      params.append('status', payload.status)

      const url = V1API.get_client + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_CLIENT', { results, pg_count })
      return result
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchClientWithoutPg({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_client_without_pg)
      commit('SET_CLIENT_WITHOUT_PG', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchClientByCompany({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_client_by_company}${payload}`)
      commit('SET_CLIENT_BY_COMPANY', data.data)
      return data
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async updateClient({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.update_client}${payload.id}`, payload.client_edit)
    dispatch('fetchClient', { perPage: payload.perPage, currentPage: payload.page, search_term: payload.search_term, status: payload.status })
    return data
  },

  async deleteClient({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_client}${payload.item}`)
    dispatch('fetchClient', { perPage: payload.perPage, currentPage: payload.page, search_term: payload.search_term, status: payload.status })
    return data
  },

  async fetchClientDetails({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.client_details}${payload}`)
      commit('SET_CLIENT_DETAILS', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchClientByUserId({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.client_by_user_id}${payload}`)
      commit('SET_CLIENT_DETAILS', data.data)
      return data
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addClient({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_client, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchClientWithoutPg')
      return data
    } catch (e) {
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
