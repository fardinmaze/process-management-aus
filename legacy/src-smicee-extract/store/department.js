// Ported from the legacy SMICEE frontend's `department.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  departments:            [],
  departmentDetail:       {},
  designationByDepartment: [],
  employeeByDesignation:   [],

  departmentLoading: false,
  departmentError:   false,

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  departments:             (state) => state.departments,
  departmentDetail:        (state) => state.departmentDetail,
  designationByDepartment: (state) => state.designationByDepartment,
  employeeByDesignation:   (state) => state.employeeByDesignation,
  departmentLoading:       (state) => state.departmentLoading,
  departmentError:         (state) => state.departmentError,
  submitLoading:           (state) => state.submitLoading,
  submitError:             (state) => state.submitError,
}

const mutations = {
  SET_DEPARTMENT(state, department) {
    state.departments = department
  },
  SET_DESIGNATION_BY_DEPARTMENT(state, designation) {
    state.designationByDepartment = designation
  },
  SET_EMPLOYEE_BY_DESIGNATION(state, emp) {
    state.employeeByDesignation = emp
  },
  DEPARTMENT_LOADING(state, loading) {
    state.departmentLoading = loading
  },
  DEPARTMENT_ERROR(state, hasError) {
    state.departmentError = hasError
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
  async fetchDepartments({ commit }) {
    commit('DEPARTMENT_LOADING', true)
    commit('DEPARTMENT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_all_departments)
      commit('SET_DEPARTMENT', data.data)
    } catch {
      commit('DEPARTMENT_ERROR', true)
    }
    commit('DEPARTMENT_LOADING', false)
  },

  async fetchDesignationByDepartment({ commit }, payload) {
    commit('DEPARTMENT_LOADING', true)
    commit('DEPARTMENT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.designation_by_department}${payload}`)
      commit('SET_DESIGNATION_BY_DEPARTMENT', data.data)
      return data.data
    } catch {
      commit('DEPARTMENT_ERROR', true)
    } finally {
      commit('DEPARTMENT_LOADING', false)
    }
  },

  async fetchEmployeeByDesignation({ commit }, payload) {
    commit('DEPARTMENT_LOADING', true)
    commit('DEPARTMENT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.user_accounts_by_designation}?designation=${payload}`)
      commit('SET_EMPLOYEE_BY_DESIGNATION', data.data)
      return data.data
    } catch {
      commit('DEPARTMENT_ERROR', true)
    } finally {
      commit('DEPARTMENT_LOADING', false)
    }
  },

  async addDepartment({ commit, dispatch }, payload) {
    commit('DEPARTMENT_LOADING', true)
    commit('DEPARTMENT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_department, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchDepartments')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('DEPARTMENT_LOADING', false)
    }
  },

  async updateDepartment({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.update_department}${payload.id}`, { name: payload.name })
    dispatch('fetchDepartments')
    return data
  },

  async deleteDepartment({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_department}${payload}`)
    dispatch('fetchDepartments')
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
