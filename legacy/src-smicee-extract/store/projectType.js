// Ported from the legacy SMICEE frontend's `projectType.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  projectType: [],

  projectTypeLoading: false,
  projectTypeError:   false,

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  projectType:        (state) => state.projectType,
  projectTypeLoading: (state) => state.projectTypeLoading,
  projectTypeError:   (state) => state.projectTypeError,
  submitLoading:      (state) => state.submitLoading,
  submitError:        (state) => state.submitError,
}

const mutations = {
  SET_PROJECT_TYPE(state, items) {
    state.projectType = items
  },
  PROJECT_TYPE_LOADING(state, loading) {
    state.projectTypeLoading = loading
  },
  PROJECT_TYPE_ERROR(state, hasError) {
    state.projectTypeError = hasError
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
  async fetchProjectType({ commit }) {
    commit('PROJECT_TYPE_LOADING', true)
    commit('PROJECT_TYPE_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_project_type)
      commit('SET_PROJECT_TYPE', data.data)
    } catch {
      commit('PROJECT_TYPE_ERROR', true)
    } finally {
      commit('PROJECT_TYPE_LOADING', false)
    }
  },

  async addProjectType({ commit, dispatch }, payload) {
    commit('PROJECT_TYPE_LOADING', true)
    commit('PROJECT_TYPE_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_project_type, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchProjectType')
      return data
    } catch (e) {
      commit('PROJECT_TYPE_ERROR', true)
    } finally {
      commit('PROJECT_TYPE_LOADING', false)
    }
  },

  async updateProjectType({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.edit_project_type}${payload.id}`, { title: payload.title })
    dispatch('fetchProjectType')
    return data
  },

  async deleteProjectType({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_project_type}${payload}`)
    dispatch('fetchProjectType')
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
