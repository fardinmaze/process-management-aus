import api    from '@/plugins/axios'
import V1API  from '@/utils/apiPaths'

const state = () => ({
  featureList:  [],
  featureCount: null,
  chainPreset:  null,
  instanceState: null,

  loading:       false,
  error:         false,
  toggleLoading: false,
  submitLoading: false,
  submitError:   false,
})

const getters = {
  featureList:   (state) => state.featureList,
  featureCount:  (state) => state.featureCount,
  chainPreset:   (state) => state.chainPreset,
  instanceState: (state) => state.instanceState,
  loading:       (state) => state.loading,
  error:         (state) => state.error,
  toggleLoading: (state) => state.toggleLoading,
  submitLoading: (state) => state.submitLoading,
  submitError:   (state) => state.submitError,
}

const mutations = {
  SET_FEATURE_LIST(state, { data, pg_count }) {
    state.featureList  = data
    state.featureCount = pg_count
  },
  SET_CHAIN_PRESET(state, preset)   { state.chainPreset = preset },
  SET_INSTANCE_STATE(state, value)  { state.instanceState = value },
  LOADING(state, loading)         { state.loading = loading },
  ERROR(state, hasError)          { state.error = hasError },
  TOGGLE_LOADING(state, loading)  { state.toggleLoading = loading },
  SUBMIT_LOADING(state, loading)  { state.submitLoading = loading },
  SUBMIT_ERROR(state, hasError)   { state.submitError = hasError },
}

const actions = {
  // Feature List page renders every feature with no pagination UI, so this
  // needs a `count` big enough to always come back in a single page —
  // defaulting to 10 was silently hiding every feature past the 10th.
  async fetchFeatureList({ commit }, payload = {}) {
    commit('LOADING', true)
    commit('ERROR', false)
    try {
      const params = new URLSearchParams()
      params.append('count', payload.count || 100)
      params.append('page', payload.page || 1)
      const { data } = await api.get(`${V1API.approval_chain_feature_list}?${params.toString()}`)
      commit('SET_FEATURE_LIST', { data: data.data || [], pg_count: data.pg_count })
      return data
    } catch {
      commit('ERROR', true)
    } finally {
      commit('LOADING', false)
    }
  },

  // Flips a feature's is_chain_enabled flag. Caller (the list page) decides
  // what to do next (e.g. open the chain-config sidebar when a feature was
  // just switched on) — this action only performs the toggle + list refresh.
  async toggleFeature({ commit, dispatch }, payload) {
    commit('TOGGLE_LOADING', true)
    commit('ERROR', false)
    try {
      const { data } = await api.patch(`${V1API.approval_chain_feature_toggle}${payload.id}`)
      dispatch('fetchFeatureList', { page: payload.page, count: payload.count })
      return data
    } catch (e) {
      commit('ERROR', true)
      throw e
    } finally {
      commit('TOGGLE_LOADING', false)
    }
  },

  // `feature` is the feature's code (e.g. "REQUISITION", "LEAVE", "EOD").
  // Returns a single preset object — { is_chain_enabled, stages: [...] } —
  // not a list of chain versions.
  // Kept around for later use — the chain-details flow now calls
  // `fetchActiveChain` instead, see below.
  async fetchChainList({ commit }, feature) {
    commit('LOADING', true)
    commit('ERROR', false)
    try {
      // Background lookup — a missing feature must not bounce the page to NotFound.
      const { data } = await api.get(`${V1API.approval_chain_list}${feature}`, { skipErrorRedirect: true })
      commit('SET_CHAIN_PRESET', data.data || null)
      return data
    } catch {
      commit('ERROR', true)
    } finally {
      commit('LOADING', false)
    }
  },

  // GET /api/approval-chain/chain/active?feature=<code> — the chain-details
  // flow's current source for a feature's chain (stages + approvers), in
  // place of `fetchChainList`'s preset-list call. Same response shape, so it
  // shares `SET_CHAIN_PRESET`/the `chainPreset` getter.
  async fetchActiveChain({ commit }, feature) {
    commit('LOADING', true)
    commit('ERROR', false)
    try {
      const { data } = await api.get(`${V1API.approval_chain_active}?feature=${encodeURIComponent(feature)}`)
      commit('SET_CHAIN_PRESET', data.data || null)
      return data
    } catch {
      commit('ERROR', true)
    } finally {
      commit('LOADING', false)
    }
  },

  // GET /api/approval-chain/instance/state/<feature>/<instance id> —
  // current stage, pending approvers, and the approve/reject action log for
  // one approval-chain instance (used to render "Approved By" on a record's
  // details page, e.g. leave details). `feature` is the feature code (e.g.
  // "LEAVE"), `id` is that record's own id (not a chain id).
  async fetchInstanceState({ commit }, { feature, id }) {
    commit('LOADING', true)
    commit('ERROR', false)
    try {
      const { data } = await api.get(`${V1API.approval_chain_instance_state}${feature}/${id}`, { skipErrorRedirect: true })
      commit('SET_INSTANCE_STATE', data.data || null)
      return data
    } catch (e) {
      commit('ERROR', true)
      throw e
    } finally {
      commit('LOADING', false)
    }
  },

  async createChain({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.approval_chain_create, payload)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async activateChain({ commit }, chainId) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(`${V1API.approval_chain_activate}${chainId}`)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Adds one more stage to an existing chain.
  // payload: { chain, sequence_no, name, rule, approver_ids }
  async createStage({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.approval_chain_stage_create, payload)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Only a stage's name/rule can be changed this way — approvers are managed
  // separately via `addStageApprover`/`deleteStageApprover`. The pk in the
  // URL is the stage's own `id` (its `stage.id` from GET chain/active), not
  // its `sequence_no`.
  async updateStage({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.put(`${V1API.approval_chain_stage_update}${payload.stage_id}`, {
        name: payload.name,
        rule: payload.rule,
      })
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // `stageId` is the stage's own `id`, matching `updateStage`'s pk.
  async deleteStage({ commit }, stageId) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.approval_chain_stage_delete}${stageId}`)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // Adds a single approver to a stage. payload: { stage, user } — `stage` is
  // the stage's `stage_id` (not `sequence_no` — that's only used by the
  // stage create/update/delete endpoints), `user` is the employee id.
  async addStageApprover({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.approval_chain_stage_approver_create, payload)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
      throw e
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  // `approverId` is a stage-approver relation id — a stage's `approvers[].id`
  // from the preset-list response, not the employee/user id.
  async deleteStageApprover({ commit }, approverId) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.approval_chain_stage_approver_delete}${approverId}`)
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
