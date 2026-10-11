// Ported from the legacy SMICEE frontend's `organization.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
// `buildFormData` (multipart helper) is replaced with this project's own
// `toFormData` from `@/utils/helpers`.
import api            from '@/plugins/axios'
import V1API           from '@/utils/apiPaths'
import { toFormData }  from '@/utils/helpers'

const state = () => ({
  organizationSetting: {},

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,
})

const getters = {
  organizationSetting: (state) => state.organizationSetting,
  submitLoading:        (state) => state.submitLoading,
  submitError:          (state) => state.submitError,
}

const mutations = {
  SET_ORGANIZATION_SETTING(state, setting) {
    state.organizationSetting = setting
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
  async fetchOrganizationSettings({ commit }) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_organization_setting)
      commit('SET_ORGANIZATION_SETTING', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    }
    commit('SUBMIT_LOADING', false)
  },

  async addOrganizationSetting({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_organizaton_setting, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchOrganizationSettings')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addOrganizationAttachment({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const formData = toFormData(payload.attachment)
      const { data } = await api.post(V1API.create_organization_attachment, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchOrganizationSettings')
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async deleteAttachmentFromOrganization({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_organization_attachment}${payload.id}`)
    dispatch('fetchOrganizationSettings')
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
