// Ported from the legacy SMICEE frontend's `designation.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  designation:             [],
  designationDetail:       {},
  designationByDepartment: [],

  designationLoading: false,
  designationError:   false,

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  designation:             (state) => state.designation,
  designationDetail:       (state) => state.designationDetail,
  designationByDepartment: (state) => state.designationByDepartment,
  designationLoading:      (state) => state.designationLoading,
  designationError:        (state) => state.designationError,
  submitLoading:           (state) => state.submitLoading,
  submitError:             (state) => state.submitError,
}

const mutations = {
  SET_DESIGNATION(state, designation) {
    state.designation = designation
  },
  SET_DESIGNATION_BY_DEPARTMENT(state, designation) {
    state.designationByDepartment = designation
  },
  SET_DESIGNATION_DETAILS(state, designation) {
    state.designationDetail = designation
  },
  DESIGNATION_LOADING(state, loading) {
    state.designationLoading = loading
  },
  DESIGNATION_ERROR(state, hasError) {
    state.designationError = hasError
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
  async fetchDesignations({ commit }) {
    commit('DESIGNATION_LOADING', true)
    commit('DESIGNATION_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_all_designations)
      commit('SET_DESIGNATION', data.data)
    } catch {
      commit('DESIGNATION_ERROR', true)
    } finally {
      commit('DESIGNATION_LOADING', false)
    }
  },

  async fetchDesignationsByDepartment({ commit }, payload) {
    commit('DESIGNATION_LOADING', true)
    commit('DESIGNATION_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_designation_by_depratment}${payload}`)
      commit('SET_DESIGNATION_BY_DEPARTMENT', data.data)
      return data.data
    } catch {
      commit('DESIGNATION_ERROR', true)
    } finally {
      commit('DESIGNATION_LOADING', false)
    }
  },

  async fetchDesignationDetails({ commit }, payload) {
    commit('DESIGNATION_LOADING', true)
    commit('DESIGNATION_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.designation_permission}/${payload}`)
      commit('SET_DESIGNATION_DETAILS', data.data)
    } catch {
      commit('DESIGNATION_ERROR', true)
    } finally {
      commit('DESIGNATION_LOADING', false)
    }
  },

  async toggleDesignationPermission({ commit, dispatch }, payload) {
    commit('DESIGNATION_LOADING', true)
    commit('DESIGNATION_ERROR', false)
    try {
      await api.get(`${V1API.toggle_designation_permission}/${payload.designation}/${payload.permission}`)
      dispatch('fetchDesignationDetails', payload.designation)
    } catch {
      commit('DESIGNATION_ERROR', true)
    } finally {
      commit('DESIGNATION_LOADING', false)
    }
  },

  async addDesignation({ commit, dispatch }, payload) {
    commit('DESIGNATION_LOADING', true)
    commit('DESIGNATION_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_designation, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchDesignations')
      return data
    } catch (e) {
      commit('DESIGNATION_ERROR', true)
    } finally {
      commit('DESIGNATION_LOADING', false)
    }
  },

  async updateDesignation({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.update_designation}${payload.id}`, {
      title: payload.title, department: payload.department,
    })
    dispatch('fetchDesignations')
    return data
  },

  async deleteDesignation({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_designaton}${payload}`)
    dispatch('fetchDesignations')
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
