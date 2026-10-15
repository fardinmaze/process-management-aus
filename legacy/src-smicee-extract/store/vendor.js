// Ported from the legacy SMICEE frontend's `vendor.js` store module.
// Dropped: raw axios + manually-attached Bearer header (the `api` instance
// already injects it), the `dataMagic` encode/decode step, and the
// `asyncHelper` boilerplate generator — none of which exist in this project.
// `buildFormData` (multipart helper) is replaced with this project's own
// `toFormData` from `@/utils/helpers`.
import api            from '@/plugins/axios'
import V1API           from '@/utils/apiPaths'
import { toFormData }  from '@/utils/helpers'

const state = () => ({
  vendor:          [],
  vendorWithoutPg: [],
  vendorCount:     null,

  vendorRFQ:      [],
  vendorCategories: [],

  vendorProjects:       [],
  vendorProjectDetail:  {},
  vendorPoByProject:    [],
  vendorBillByProject:  [],
  purchaseOrderList:      [],
  purchaseOrderListCount: null,
  billList:               [],

  vendorContact:      [],
  vendorContactCount: null,
  vendorDetails:      {},
  vendorByUser:       {},
  label:              [],

  vendorLoading:       false,
  vendorError:         false,
  vendorSubmitSuccess: false,
})

const getters = {
  vendor:                 (state) => state.vendor,
  vendorWithoutPg:        (state) => state.vendorWithoutPg,
  vendorCount:            (state) => state.vendorCount,
  vendorRFQ:              (state) => state.vendorRFQ,
  vendorCategories:       (state) => state.vendorCategories,
  vendorProjects:         (state) => state.vendorProjects,
  vendorProjectDetail:    (state) => state.vendorProjectDetail,
  vendorPoByProject:      (state) => state.vendorPoByProject,
  vendorBillByProject:    (state) => state.vendorBillByProject,
  purchaseOrderList:      (state) => state.purchaseOrderList,
  purchaseOrderListCount: (state) => state.purchaseOrderListCount,
  billList:               (state) => state.billList,
  vendorContact:          (state) => state.vendorContact,
  vendorContactCount:     (state) => state.vendorContactCount,
  vendorDetails:          (state) => state.vendorDetails,
  vendorByUser:           (state) => state.vendorByUser,
  label:                  (state) => state.label,
  vendorLoading:          (state) => state.vendorLoading,
  vendorError:            (state) => state.vendorError,
  vendorSubmitSuccess:    (state) => state.vendorSubmitSuccess,
}

const mutations = {
  SET_VENDOR_CATEGORIES(state, vendorCategory) {
    state.vendorCategories = vendorCategory
  },
  SET_VENDOR(state, { results, pg_count }) {
    state.vendor      = results
    state.vendorCount = pg_count
  },
  SET_VENDOR_WITHOUT_PG(state, results) {
    state.vendorWithoutPg = results
  },
  SET_VENDOR_RFQ(state, rfq) {
    state.vendorRFQ = rfq
  },
  SET_VENDOR_CONTACT(state, { results, pg_count }) {
    state.vendorContact      = results
    state.vendorContactCount = pg_count
  },
  SET_VENDOR_DETAILS(state, details) {
    state.vendorDetails = details
  },
  SET_VENDOR_DETAILS_BY_USER_ID(state, details) {
    state.vendorByUser = details
  },
  SET_VENDOR_CONTACT_LABELS(state, label) {
    state.label = label
  },
  SET_VENDOR_PURCHASE_ORDER_LIST(state, { results, pg_count }) {
    state.purchaseOrderList      = results
    state.purchaseOrderListCount = pg_count
  },
  SET_VENDOR_BILL_LIST(state, bill) {
    state.billList = bill
  },
  SET_VENDOR_PO_BY_PROJECT(state, po) {
    state.vendorPoByProject = po
  },
  SET_VENDOR_BILL_BY_PROJECT(state, bill) {
    state.vendorBillByProject = bill
  },
  SET_VENDOR_PROJECT_DETAILS(state, details) {
    state.vendorProjectDetail = details
  },
  SET_VENDOR_PROJECTS(state, project) {
    state.vendorProjects = project
  },
  VENDOR_LOADING(state, loading) {
    state.vendorLoading = loading
  },
  VENDOR_ERROR(state, hasError) {
    state.vendorError = hasError
  },
  VENDOR_SUBMIT_SUCCESS(state, success) {
    state.vendorSubmitSuccess = success
  },
}

const actions = {
  async fetchVendor({ commit }, payload = {}) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.search_term) params.append('search_term', payload.search_term)
      if (payload.status)      params.append('status', payload.status)
      if (payload.category)    params.append('category', payload.category)

      const url = V1API.get_vendor + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_VENDOR', { results, pg_count })
      return result
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorWithoutPg({ commit }) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_vendor_without_pg)
      commit('SET_VENDOR_WITHOUT_PG', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorByUserId({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.vendor_by_user_id}${payload}`)
      commit('SET_VENDOR_DETAILS_BY_USER_ID', data.data)
      return data
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorDetails({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.venodr_details}${payload}`)
      commit('SET_VENDOR_DETAILS', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async addVendor({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_vendor, payload.item)
      commit('VENDOR_SUBMIT_SUCCESS', true)
      dispatch('fetchVendorWithoutPg')
      dispatch('fetchVendor', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, status: payload.status, category: payload.category })
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async updateVendor({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.vendor_edit}${payload.id}`, {
      phone: payload.phone, company: payload.company, address: payload.address, category: payload.new_category,
    })
    dispatch('fetchVendor', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, status: payload.status, category: payload.category })
    return data
  },

  async deleteVendor({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_vendor}${payload.delete}`)
    dispatch('fetchVendor', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, status: payload.status, category: payload.category })
    return data
  },

  async updateVendorStatus({ dispatch }, payload) {
    const { data } = await api.get(`${V1API.toggle_vendor_status}${payload.status_for_change}`)
    dispatch('fetchVendor', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, status: payload.status, category: payload.category })
    return data
  },

  // Vendor contact
  async fetchVendorContact({ commit }, payload = {}) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)
      if (payload.search_term) params.append('search_term', payload.search_term)
      if (payload.contacted)   params.append('contacted', payload.contacted)
      if (payload.label)       params.append('label', payload.label)

      const url = V1API.get_vendor_contact + '?' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_VENDOR_CONTACT', { results, pg_count })
      return result
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async addVendorContact({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(V1API.vendor_contact_create, payload.add_item)
      commit('VENDOR_SUBMIT_SUCCESS', true)
      dispatch('fetchVendorContact', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, contacted: payload.contacted, label: payload.label })
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async updateVendorContact({ dispatch }, payload) {
    const { data } = await api.patch(`${V1API.vendor_contact_edit}${payload.id}`, payload.update)
    dispatch('fetchVendorContact', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, contacted: payload.contacted, label: payload.label })
    return data
  },

  async deleteVendorContact({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_vendor_contact}${payload.delete_id}`)
    dispatch('fetchVendorContact', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, contacted: payload.contacted, label: payload.label })
    return data
  },

  // Vendor contact labels
  async fetchVendorContactLabel({ commit }) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(V1API.venodr_contact_label_lists)
      commit('SET_VENDOR_CONTACT_LABELS', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async addVendorContactLabel({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(V1API.vendor_contact_label_create, { name: payload })
      commit('VENDOR_SUBMIT_SUCCESS', true)
      dispatch('fetchVendorContactLabel')
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async deleteVendorContactLabel({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.vendor_label_delete}${payload}`)
    dispatch('fetchVendorContactLabel')
    return data
  },

  async addLabelToVendorContact({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(`${V1API.vendor_contact_label_add}${payload.vendor}`, { label_id: payload.label_id })
      dispatch('fetchVendorContactLabel')
      dispatch('fetchVendorContact', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, contacted: payload.contacted, label: payload.label })
      return data
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async deleteLabelFromVendorContact({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(`${V1API.vendor_contact_label_delete}${payload.vendor}`, { label_id: payload.label_id })
      dispatch('fetchVendorContactLabel')
      dispatch('fetchVendorContact', { currentPage: payload.page, perPage: payload.perPage, search_term: payload.search_term, contacted: payload.contacted, label: payload.label })
      return data
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  // Vendor category
  async fetchVendorCategory({ commit }) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(V1API.get_vendor_categories)
      commit('SET_VENDOR_CATEGORIES', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async addVendorCategory({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(V1API.add_vendor_category, payload)
      commit('VENDOR_SUBMIT_SUCCESS', true)
      dispatch('fetchVendorCategory')
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async updateVendorCategory({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.patch(`${V1API.edit_vendor_category}${payload.id}`, { title: payload.title })
      commit('VENDOR_SUBMIT_SUCCESS', true)
      dispatch('fetchVendorCategory')
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async deleteVendorCategory({ dispatch }, payload) {
    const { data } = await api.delete(`${V1API.delete_vendor_category}${payload}`)
    dispatch('fetchVendorCategory')
    return data
  },

  // Request for quotation
  async requestForQuotation({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      payload.details = JSON.stringify(payload.details)
      const formData = toFormData(payload)
      const { data } = await api.post(V1API.vendor_request_for_quotation, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('VENDOR_SUBMIT_SUCCESS', true)
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorRFQ({ commit }) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(V1API.vendor_rfq_list)
      commit('SET_VENDOR_RFQ', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  // Vendor projects
  async fetchProjectHasVendor({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.project_list_by_vendor}${payload}`)
      commit('SET_VENDOR_PROJECTS', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorProjectDetails({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.vendor_project_details}${payload}`)
      commit('SET_VENDOR_PROJECT_DETAILS', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorPurchaseOrderByProject({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.vendor_purchase_order_by_project}${payload.project}/?vendorid=${payload.vendor}`)
      commit('SET_VENDOR_PO_BY_PROJECT', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorBillByProject({ commit }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.vendor_bill_by_project}${payload.project}/?vendorid=${payload.vendor}`)
      commit('SET_VENDOR_BILL_BY_PROJECT', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorPurchaseOrder({ commit }, payload = {}) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const params = new URLSearchParams()
      if (payload.perPage)     params.append('count', payload.perPage)
      if (payload.currentPage) params.append('page', payload.currentPage)

      const url = V1API.po_list_by_vendor + '?status=APPROVED&' + params.toString()
      const result = await api.get(url)
      const { results, pg_count } = result.data
      commit('SET_VENDOR_PURCHASE_ORDER_LIST', { results, pg_count })
      return result
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async fetchVendorBill({ commit }) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(V1API.bill_list_by_vendor)
      commit('SET_VENDOR_BILL_LIST', data.data)
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async addVendorAttachment({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const formData = toFormData(payload)
      const { data } = await api.post(V1API.add_vendor_documents, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      commit('VENDOR_SUBMIT_SUCCESS', true)
      dispatch('fetchVendorDetails', payload.vendor_id)
      return data
    } catch (e) {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async acceptPurchaseOrder({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.accept_vendor_po}${payload.id}`)
      dispatch('fetchVendorPurchaseOrder', { currentPage: payload.page, perPage: payload.perPage })
      return data
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
    }
  },

  async rejectPurchaseOrder({ commit, dispatch }, payload) {
    commit('VENDOR_LOADING', true)
    commit('VENDOR_ERROR', false)
    try {
      const { data } = await api.post(`${V1API.reject_vendor_po}${payload.id}`, {
        vendor_rejection_reason: payload.vendor_rejection_reason,
      })
      dispatch('fetchVendorPurchaseOrder', { currentPage: payload.page, perPage: payload.perPage })
      return data
    } catch {
      commit('VENDOR_ERROR', true)
    } finally {
      commit('VENDOR_LOADING', false)
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
