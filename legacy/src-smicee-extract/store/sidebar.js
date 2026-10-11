const SIDEBAR_KEY = 'admin_sidebar_collapsed'

const state = () => ({
  collapsed:   localStorage.getItem(SIDEBAR_KEY) === 'true',
  activeRoute: '',
  mobileOpen:  false,
})

const getters = {
  collapsed:   (state) => state.collapsed,
  activeRoute: (state) => state.activeRoute,
  mobileOpen:  (state) => state.mobileOpen,
}

const mutations = {
  TOGGLE_COLLAPSED(state) {
    state.collapsed = !state.collapsed
    localStorage.setItem(SIDEBAR_KEY, state.collapsed)
  },

  SET_COLLAPSED(state, value) {
    state.collapsed = value
    localStorage.setItem(SIDEBAR_KEY, value)
  },

  SET_ACTIVE_ROUTE(state, routeName) {
    state.activeRoute = routeName
  },

  SET_MOBILE_OPEN(state, value) {
    state.mobileOpen = value
  },
}

const actions = {
  toggle({ commit }) {
    commit('TOGGLE_COLLAPSED')
  },

  collapse({ commit }) {
    commit('SET_COLLAPSED', true)
  },

  expand({ commit }) {
    commit('SET_COLLAPSED', false)
  },

  setActiveRoute({ commit }, routeName) {
    commit('SET_ACTIVE_ROUTE', routeName)
  },

  openMobile({ commit }) {
    commit('SET_MOBILE_OPEN', true)
  },

  closeMobile({ commit }) {
    commit('SET_MOBILE_OPEN', false)
  },

  toggleMobile({ commit, state }) {
    commit('SET_MOBILE_OPEN', !state.mobileOpen)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
