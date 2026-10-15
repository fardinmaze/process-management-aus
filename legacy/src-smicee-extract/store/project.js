// Ported from the legacy SMICEE frontend's `project.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, the
// `asyncHelper` boilerplate generator, and `fetchAreaByState` (called
// `V1API.area_by_state_get`, a stray reference with no corresponding
// endpoint in this project's ported map) — none of which exist/apply here.
// `buildFormData` is replaced with this project's own `toFormData`.
import api            from '@/plugins/axios'
import V1API           from '@/utils/apiPaths'
import { toFormData }  from '@/utils/helpers'

const state = () => ({
  project:                [],
  projectPaginated:       [],
  projectCount:           null,
  projectArchivedPaginated: [],
  projectArchivedCount:     null,
  projectDetail:          {},
  projectAttachmentAll:   [],
  projectBySearch:        [],
  myProjectBySearch:      [],
  projectTrackingDetail:  {},
  projectTeamLead:        [],

  myProject:      [],
  count:          null,
  myTask:         [],
  myTaskDeadline: [],

  clientByProject:      [],
  vendorByProject:      [],
  budgetByProject:      [],
  quotationByProject:   [],
  invoiceByProject:     [],
  requisitionByProject: [],
  purchaseRequisitionByProject: [],
  purchaseOrderByProject: [],
  billListByProject:    [],
  rfpListByProject:     [],
  projectMember:        [],
  taskMember:           [],

  submitLoading:        false,
  submitError:          false,
  submitSuccess:        false,
  detailLoading:        false,
  detailError:          false,
  teamLeadLoading:      false,
  teamLeadError:        false,
  trackingDetailLoading: false,
  trackingDetailError:  false,
})

const getters = {
  project:                  (state) => state.project,
  projectPaginated:         (state) => state.projectPaginated,
  projectCount:             (state) => state.projectCount,
  projectArchivedPaginated: (state) => state.projectArchivedPaginated,
  projectArchivedCount:     (state) => state.projectArchivedCount,
  projectDetail:            (state) => state.projectDetail,
  projectAttachmentAll:     (state) => state.projectAttachmentAll,
  projectBySearch:          (state) => state.projectBySearch,
  myProjectBySearch:        (state) => state.myProjectBySearch,
  projectTrackingDetail:    (state) => state.projectTrackingDetail,
  projectTeamLead:          (state) => state.projectTeamLead,
  myProject:                (state) => state.myProject,
  count:                    (state) => state.count,
  myTask:                   (state) => state.myTask,
  myTaskDeadline:           (state) => state.myTaskDeadline,
  clientByProject:          (state) => state.clientByProject,
  vendorByProject:          (state) => state.vendorByProject,
  budgetByProject:          (state) => state.budgetByProject,
  quotationByProject:       (state) => state.quotationByProject,
  invoiceByProject:         (state) => state.invoiceByProject,
  requisitionByProject:     (state) => state.requisitionByProject,
  purchaseRequisitionByProject: (state) => state.purchaseRequisitionByProject,
  purchaseOrderByProject:   (state) => state.purchaseOrderByProject,
  billListByProject:        (state) => state.billListByProject,
  rfpListByProject:         (state) => state.rfpListByProject,
  projectMember:            (state) => state.projectMember,
  taskMember:               (state) => state.taskMember,
  submitLoading:            (state) => state.submitLoading,
  submitError:              (state) => state.submitError,
  detailLoading:            (state) => state.detailLoading,
  detailError:              (state) => state.detailError,
  teamLeadLoading:          (state) => state.teamLeadLoading,
  teamLeadError:            (state) => state.teamLeadError,
}

const mutations = {
  SET_PROJECT(state, project) { state.project = project },
  SET_PROJECT_PAGINATED(state, { results, pg_count }) {
    state.projectPaginated = results
    state.projectCount     = pg_count
  },
  SET_PROJECT_ARCHIVED_PAGINATED(state, { results, pg_count }) {
    state.projectArchivedPaginated = results
    state.projectArchivedCount     = pg_count
  },
  SET_MY_PROJECT(state, { results, count }) {
    state.myProject = results
    state.count      = count
  },
  SET_MY_TASK(state, project) { state.myTask = project },
  SET_MY_TASK_DEADLINE(state, project) { state.myTaskDeadline = project },
  SET_CLIENT_BY_PROJECT(state, client) { state.clientByProject = client },
  SET_VENDOR_BY_PROJECT(state, vendor) { state.vendorByProject = vendor },
  SET_PROJECT_DETAIL(state, project) { state.projectDetail = project },
  SET_PROJECT_ATTACHMENT(state, attachment) { state.projectAttachmentAll = attachment },
  SET_PROJECT_MEMBER(state, member) { state.projectMember = member },
  SET_TASK_MEMBER(state, member) { state.taskMember = member },
  SET_BUDGET_BY_PROJECT(state, budget) { state.budgetByProject = budget },
  SET_QUOTATION_BY_PROJECT(state, quotation) { state.quotationByProject = quotation },
  SET_REQUISITION_BY_PROJECT(state, requisition) { state.requisitionByProject = requisition },
  SET_PURCHASE_REQUISITION_BY_PROJECT(state, pr) { state.purchaseRequisitionByProject = pr },
  SET_PURCHASE_ORDER_BY_PROJECT(state, po) { state.purchaseOrderByProject = po },
  SET_INVOICE_BY_PROJECT(state, invoice) { state.invoiceByProject = invoice },
  SET_BILL_LIST_BY_PROJECT(state, bill) { state.billListByProject = bill },
  SET_PROJECT_BY_SEARCH(state, project) { state.projectBySearch = project },
  SET_MY_PROJECT_BY_SEARCH(state, project) { state.myProjectBySearch = project },
  SET_RFP_LIST_BY_PROJECT(state, rfp) { state.rfpListByProject = rfp },
  PROJECT_LOADING(state, loading) { state.submitLoading = loading },
  PROJECT_ERROR(state, hasError) { state.submitError = hasError },
  PROJECT_TEAMLEAD_LOADING(state, loading) { state.teamLeadLoading = loading },
  PROJECT_TEAMLEAD_ERROR(state, hasError) { state.teamLeadError = hasError },
  PROJECT_DETAIL_LOADING(state, loading) { state.detailLoading = loading },
  PROJECT_DETAIL_ERROR(state, hasError) { state.detailError = hasError },
  SET_PROJECT_TRACKING_DETAIL(state, project) { state.projectTrackingDetail = project },
  PROJECT_TRACKING_DETAIL_LOADING(state, loading) { state.trackingDetailLoading = loading },
  PROJECT_TRACKING_DETAIL_ERROR(state, hasError) { state.trackingDetailError = hasError },
  SET_PROJECT_TEAM_LEAD(state, list) { state.projectTeamLead = list },
  PROJECT_SUCCESS(state, success) { state.submitSuccess = success },
}

const actions = {
  async fetchProjectTeamLeadList({ commit }) {
    commit('PROJECT_TEAMLEAD_LOADING', true)
    commit('PROJECT_TEAMLEAD_ERROR', false)
    try {
      const { data } = await api.get(V1API.team_lead_list)
      commit('SET_PROJECT_TEAM_LEAD', data.data)
      return data.data
    } catch {
      commit('PROJECT_TEAMLEAD_ERROR', true)
    } finally {
      commit('PROJECT_TEAMLEAD_LOADING', false)
    }
  },

  async fetchProjectBySearch({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const url = payload.project_status === 'ALL'
        ? `${V1API.project_search}?search_term=${payload.search_term}`
        : `${V1API.project_search}?project_status=${payload.project_status}&search_term=${payload.search_term}`
      const { data } = await api.get(url)
      commit('SET_PROJECT_BY_SEARCH', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchMyProjectBySearch({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const url = payload.project_status === 'ALL'
        ? `${V1API.my_project_search}?search_term=${payload.search_term}`
        : `${V1API.my_project_search}?project_status=${payload.project_status}&search_term=${payload.search_term}`
      const { data } = await api.get(url)
      commit('SET_MY_PROJECT_BY_SEARCH', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const url = payload ? `${V1API.get_project}?project_status=${payload}` : V1API.get_project
      const { data } = await api.get(url)
      commit('SET_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchProjectTrackingDetails({ commit }, payload) {
    commit('PROJECT_TRACKING_DETAIL_LOADING', true)
    commit('PROJECT_TRACKING_DETAIL_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_project_tracking_details}${payload}`)
      commit('SET_PROJECT_TRACKING_DETAIL', data.data)
      return data
    } catch {
      commit('PROJECT_TRACKING_DETAIL_ERROR', true)
    } finally {
      commit('PROJECT_TRACKING_DETAIL_LOADING', false)
    }
  },

  async fetchPaginatedProject({ commit }, payload = {}) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)        params.append('count', payload.perPage)
      if (payload.currentPage)    params.append('page', payload.currentPage)
      if (payload.project_status) params.append('project_status', payload.project_status)
      if (payload.created_at)     params.append('created_at', payload.created_at)
      if (payload.search_term)    params.append('search_term', payload.search_term)
      if (payload.team_lead)      params.append('team_lead', payload.team_lead)
      if (payload.client)         params.append('client', payload.client)
      if (payload.project_type)   params.append('category', payload.project_type)

      const url = V1API.get_project_paginated + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_PROJECT_PAGINATED', { results, pg_count })
      return result
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchPaginatedArchivedProject({ commit }, payload = {}) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)        params.append('count', payload.perPage)
      if (payload.currentPage)    params.append('page', payload.currentPage)
      if (payload.project_status) params.append('project_status', payload.project_status)
      if (payload.search_term)    params.append('search_term', payload.search_term)

      const url = V1API.get_project_archived_paginated + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_PROJECT_ARCHIVED_PAGINATED', { results, pg_count })
      return result
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async updateProjectStatus({ commit, dispatch }, payload) {
    try {
      const { data } = await api.get(`${V1API.update_project_status}${payload.id}/${payload.status_for_change}`)
      if (payload.from_archived) {
        dispatch('fetchPaginatedArchivedProject', { currentPage: payload.page, perPage: payload.perPage, project_status: payload.project_status, search_term: payload.search_term })
      } else {
        dispatch('fetchPaginatedProject', { currentPage: payload.page, perPage: payload.perPage, project_status: payload.project_status, search_term: payload.search_term })
      }
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchClientByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.client_list_by_project}${payload}`)
      commit('SET_CLIENT_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchMyProject({ commit }, payload = {}) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)        params.append('count', payload.perPage)
      if (payload.currentPage)    params.append('page', payload.currentPage)
      if (payload.project_status) params.append('project_status', payload.project_status)
      if (payload.search_term)    params.append('search_term', payload.search_term)
      if (payload.created_at)     params.append('created_at', payload.created_at)
      if (payload.team_lead)      params.append('team_lead', payload.team_lead)
      if (payload.client)         params.append('client', payload.client)

      const url = V1API.get_my_project + '?' + params.toString()
      const result = await api.get(url)
      const { results, count } = result.data
      commit('SET_MY_PROJECT', { results, count })
      return result
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchMyProjectDetails({ commit }, payload) {
    commit('PROJECT_DETAIL_LOADING', true)
    commit('PROJECT_DETAIL_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_my_project_authorized}${payload}`)
      commit('SET_PROJECT_DETAIL', data.data)
      return data
    } catch {
      commit('PROJECT_DETAIL_ERROR', true)
    } finally {
      commit('PROJECT_DETAIL_LOADING', false)
    }
  },

  async fetchMyTask({ commit }) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_my_task)
      commit('SET_MY_TASK', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchMyTaskDeadlineToday({ commit }) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_my_task_deadline)
      commit('SET_MY_TASK_DEADLINE', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async toggleSubTaskComplete({ commit, dispatch }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.toggle_subtask_complete_status}${payload.id}`)
      commit('PROJECT_SUCCESS', true)
      dispatch('fetchMyTask')
      dispatch('fetchMyTaskDeadlineToday')
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async toggleTaskComplete({ commit, dispatch }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.toggle_task_complete_status}${payload.id}`)
      commit('PROJECT_SUCCESS', true)
      dispatch('fetchMyTask')
      dispatch('fetchMyTaskDeadlineToday')
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async deleteProject({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_project}${payload.id}`)
    if (payload.from_archived) {
      dispatch('fetchPaginatedArchivedProject', { currentPage: payload.page, perPage: payload.perPage, project_status: payload.project_status, search_term: payload.search_term })
    } else {
      dispatch('fetchPaginatedProject', { currentPage: payload.page, perPage: payload.perPage, project_status: payload.project_status, search_term: payload.search_term })
    }
    return data
  },

  async checkMyPassword({ commit }, payload) {
    try {
      const { data } = await api.post(V1API.check_my_password, { password: payload.password })
      commit('PROJECT_SUCCESS', true)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async checkLeadPassword({ commit }, payload) {
    try {
      const { data } = await api.post(V1API.check_lead_password, {
        password: payload.password, project_id: payload.project_id,
      })
      commit('PROJECT_SUCCESS', true)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchProjectDetails({ commit }, payload) {
    commit('PROJECT_DETAIL_LOADING', true)
    commit('PROJECT_DETAIL_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_project_detail}${payload}`)
      commit('SET_PROJECT_DETAIL', data.data)
      return data
    } catch {
      commit('PROJECT_DETAIL_ERROR', true)
    } finally {
      commit('PROJECT_DETAIL_LOADING', false)
    }
  },

  async fetchProjectAttachment({ commit }, payload) {
    commit('PROJECT_DETAIL_LOADING', true)
    commit('PROJECT_DETAIL_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_project_attachment}${payload}`)
      commit('SET_PROJECT_ATTACHMENT', data.data)
      return data
    } catch {
      commit('PROJECT_DETAIL_ERROR', true)
    } finally {
      commit('PROJECT_DETAIL_LOADING', false)
    }
  },

  async makeNewProjectLead({ dispatch }, payload) {
    const { data } = await api.post(V1API.make_new_project_lead, {
      project_id: payload.project, member_id: payload.lead,
    })
    dispatch('fetchProjectDetails', payload.project)
    return data
  },

  async deleteAttachmentFromProjects({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_attachment}${payload.id}`)
    dispatch('fetchProjectDetails', payload.project_id)
    // fetchProjectDetails doesn't touch projectAttachmentAll — refresh it too
    // so a deleted row doesn't linger in the Supporting Documents panel.
    dispatch('fetchProjectAttachment', payload.project_id)
    return data
  },

  async deleteTeammateFromProjects({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_teammate_from_projects}${payload.id}`)
    dispatch('fetchProjectDetails', payload.detail_id)
    return data
  },

  async deleteClientFromProjects({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_client_from_project}${payload.id}`)
    dispatch('fetchClientByProject', payload.detail_id)
    return data
  },

  async deleteVendorFromProjects({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_vendor_from_project}${payload.id}`)
    dispatch('fetchVendorByProject', payload.detail_id)
    return data
  },

  async assignProjectEmployee({ commit, dispatch }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.post(V1API.assign_project_employee, {
        project_id: payload.project_id, member_id: payload.member_id,
      })
      commit('PROJECT_SUCCESS', true)
      dispatch('fetchProjectDetails', payload.project_id)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async addProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const formData = toFormData(payload.project)
      if (payload.employee !== null) {
        payload.employee.forEach((item) => formData.append('employee_ids', item))
      }
      const { data } = await api.post(V1API.create_project, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('PROJECT_SUCCESS', true)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async updateProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const formData = toFormData(payload.project)
      if (payload.employee !== null) {
        payload.employee.forEach((item) => formData.append('employee_ids', item))
      }
      const { data } = await api.patch(`${V1API.update_project}${payload.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('PROJECT_SUCCESS', true)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async addProjectAttachment({ commit, dispatch }, payload) {
    commit('PROJECT_DETAIL_LOADING', true)
    commit('PROJECT_DETAIL_ERROR', false)
    try {
      const formData = toFormData(payload.attachment)
      const { data } = await api.post(V1API.create_project_attachment, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('PROJECT_SUCCESS', true)
      dispatch('fetchProjectDetails', payload.project_id)
      // fetchProjectDetails doesn't touch projectAttachmentAll — refresh it
      // too so a newly-added document shows up without reopening the panel.
      dispatch('fetchProjectAttachment', payload.project_id)
      return data
    } catch (e) {
      commit('PROJECT_DETAIL_ERROR', true)
    } finally {
      commit('PROJECT_DETAIL_LOADING', false)
    }
  },

  async updateProjectPriority({ commit, dispatch }, payload) {
    try {
      const { data } = await api.get(`${V1API.update_project_priority}${payload.id}/${payload.status}`)
      dispatch('fetchProjectDetails', payload.id)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async projectAddClient({ commit, dispatch }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.post(V1API.add_client_to_project, {
        project_id: payload.project_id, client_id: payload.client_id,
      })
      dispatch('fetchClientByProject', payload.project_id)
      dispatch('fetchProjectDetails', payload.project_id)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchVendorByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.vendor_list_by_project}${payload}`)
      commit('SET_VENDOR_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async projectAddVendor({ commit, dispatch }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.post(V1API.add_vendor_to_project, {
        project_id: payload.project_id, vendor_id: payload.vendor_id,
      })
      dispatch('fetchVendorByProject', payload.project_id)
      return data
    } catch (e) {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchBudgetByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.budget_by_project}${payload}`)
      commit('SET_BUDGET_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchQuotationByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.quotation_by_project}${payload}`)
      commit('SET_QUOTATION_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchInvoiceByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.invoice_by_project}${payload}`)
      commit('SET_INVOICE_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchRequisitionByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.requisition_by_project}${payload}`)
      commit('SET_REQUISITION_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchPurchaseRequisitionByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.purchase_requisition_by_project}${payload}`)
      commit('SET_PURCHASE_REQUISITION_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchPurchaseOrderByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.purchase_order_by_project}${payload}`)
      commit('SET_PURCHASE_ORDER_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchBillByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.bill_list_by_project}${payload}`)
      commit('SET_BILL_LIST_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchRFPByProject({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.rfp_list_by_project}${payload}`)
      commit('SET_RFP_LIST_BY_PROJECT', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchProjectMemberList({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.project_member_list}${payload}`)
      commit('SET_PROJECT_MEMBER', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
    }
  },

  async fetchTaskMemberList({ commit }, payload) {
    commit('PROJECT_LOADING', true)
    commit('PROJECT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.project_task_member_list}${payload}`)
      commit('SET_TASK_MEMBER', data.data)
    } catch {
      commit('PROJECT_ERROR', true)
    } finally {
      commit('PROJECT_LOADING', false)
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
