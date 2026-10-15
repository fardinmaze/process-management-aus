// Ported from the legacy SMICEE frontend's `employee.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
// `buildFormData` (multipart helper) is replaced with this project's own
// `toFormData` from `@/utils/helpers`.
import api             from '@/plugins/axios'
import V1API            from '@/utils/apiPaths'
import { toFormData }   from '@/utils/helpers'

const state = () => ({
  employeeList:      [],
  employeeListPg:    [],
  employeeListPgCount: null,
  employeeDetail:    {},
  myDetail:          {},
  bankDetail:        {},

  employeeAsset:      [],
  employeeAssetCount: null,

  employeeProject:      [],
  employeeProjectCount: null,

  employeeTicket:      [],
  employeeTicketCount: null,

  employeeLeave:      [],
  employeeLeaveCount: null,

  employeeEod:      [],
  employeeEodCount: null,

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  employeeList:         (state) => state.employeeList,
  employeeListPg:        (state) => state.employeeListPg,
  employeeListPgCount:    (state) => state.employeeListPgCount,
  employeeDetail:         (state) => state.employeeDetail,
  myDetail:               (state) => state.myDetail,
  bankDetail:             (state) => state.bankDetail,
  employeeAsset:          (state) => state.employeeAsset,
  employeeAssetCount:     (state) => state.employeeAssetCount,
  employeeProject:        (state) => state.employeeProject,
  employeeProjectCount:   (state) => state.employeeProjectCount,
  employeeTicket:         (state) => state.employeeTicket,
  employeeTicketCount:    (state) => state.employeeTicketCount,
  employeeLeave:          (state) => state.employeeLeave,
  employeeLeaveCount:     (state) => state.employeeLeaveCount,
  employeeEod:            (state) => state.employeeEod,
  employeeEodCount:       (state) => state.employeeEodCount,
  submitLoading:          (state) => state.submitLoading,
  submitError:            (state) => state.submitError,
}

const mutations = {
  SET_EMPLOYEE(state, employee) {
    state.employeeList = employee
  },
  SET_EMPLOYEE_WITHPG(state, { results, pg_count }) {
    state.employeeListPg     = results
    state.employeeListPgCount = pg_count
  },
  SET_EMPLOYEE_DETAIL(state, detail) {
    state.employeeDetail = detail
  },
  SET_MY_DETAIL(state, detail) {
    state.myDetail = detail
  },
  SET_EMPLOYEE_BANK_DETAIL(state, data) {
    state.bankDetail = data
  },
  SET_EMPLOYEE_ASSET(state, { data, count }) {
    state.employeeAsset      = data
    state.employeeAssetCount = count
  },
  SET_EMPLOYEE_PROJECT(state, { data, count }) {
    state.employeeProject      = data
    state.employeeProjectCount = count
  },
  SET_EMPLOYEE_TICKET(state, { data, count }) {
    state.employeeTicket      = data
    state.employeeTicketCount = count
  },
  SET_EMPLOYEE_LEAVE(state, { data, count }) {
    state.employeeLeave      = data
    state.employeeLeaveCount = count
  },
  SET_EMPLOYEE_EOD(state, { data, count }) {
    state.employeeEod      = data
    state.employeeEodCount = count
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
  async fetchOptimisedEmployeeList({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_all_employee_optimised)
      commit('SET_EMPLOYEE', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeList({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_all_employee)
      commit('SET_EMPLOYEE', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeListWithPg({ commit }, payload = {}) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.start_date)  params.append('start_date', payload.start_date)
      if (payload.end_date)    params.append('end_date', payload.end_date)
      if (payload.department)  params.append('department', payload.department)
      if (payload.search_term) params.append('search_term', payload.search_term)
      if (payload.designation) params.append('designation', payload.designation)
      if (payload.employee)    params.append('employee', payload.employee)

      const url = V1API.get_all_employee_withpg + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_EMPLOYEE_WITHPG', { results, pg_count })
      return result
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchMyDetails({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.my_employee_details)
      commit('SET_MY_DETAIL', data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeDetail({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.employee_details}${payload}`)
      commit('SET_EMPLOYEE_DETAIL', data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeAsset({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const result = await api.get(V1API.get_employee_asset + payload)
      const { data, count } = result.data
      commit('SET_EMPLOYEE_ASSET', { data, count })
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeProject({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const result = await api.get(V1API.project_list_by_employee + payload)
      const { data, count } = result.data
      commit('SET_EMPLOYEE_PROJECT', { data, count })
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeTicket({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const result = await api.get(V1API.get_ticket_list_employee + payload)
      const { data, count } = result.data
      commit('SET_EMPLOYEE_TICKET', { data, count })
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeLeave({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const result = await api.get(V1API.get_leave_employee + payload)
      const { data, count } = result.data
      commit('SET_EMPLOYEE_LEAVE', { data, count })
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchEmployeeEOD({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const result = await api.get(V1API.get_eod_list_by_employee + payload)
      const { data, count } = result.data
      commit('SET_EMPLOYEE_EOD', { data, count })
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addEmployee({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_employee, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchEmployeeList')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async updateEmployee({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.patch(`${V1API.update_employee_information}${payload.id}`, payload.info)
      dispatch('fetchEmployeeList')
      dispatch('fetchEmployeeDetail', payload.id)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async deleteEmployee({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.update_employee_delete}/${payload.item}`)
    dispatch('fetchEmployeeListWithPg', {
      perPage: payload.perPage, currentPage: payload.page,
      start_date: payload.start_date, end_date: payload.end_date,
      search_term: payload.search_term, employee: payload.employee,
      department: payload.department, designation: payload.designation,
    })
    return data
  },

  async toggleActiveStatus({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.toggle_employee_active}${payload.item}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchEmployeeListWithPg', { perPage: payload.perPage, currentPage: payload.page })
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addEmployeeAttachment({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const formData = toFormData(payload.attachment)
      const { data } = await api.post(V1API.employee_add_attachment, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchMyDetails')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async deleteAttachmentFromEmployee({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.employee_delete_attachment}${payload.id}`)
    dispatch('fetchMyDetails')
    return data
  },

  async addBankInfo({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_bank_info, payload.bank_info)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchBankDetailsByEmployee', payload.employee_id)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchBankDetailsByEmployee({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_bank_details_by_employee}${payload}`)
      commit('SET_EMPLOYEE_BANK_DETAIL', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async generateTelegramCode() {
    const { data } = await api.get(V1API.telegram_code_generate)
    return data
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
