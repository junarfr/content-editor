export const state = () => ({
  profile: null,
  privileges: {},
})

export const getters = {
  login: state => state.profile ? state.profile.id : null,
  userName: state => state.profile ? state.profile.name : '',
  initials: (state, getters) => {
    const [first, last] = getters.userName.split(' ')
    if (first && last) {
      return (first.substr(0, 1) + last.substr(0, 1)).toUpperCase()
    } else if (first) {
      return first.substr(0, 2).toUpperCase()
    } else if (last) {
      return last.substr(0, 2).toUpperCase()
    } else {
      return '??'
    }
  },
  privilegesForStory: state => storyID =>
    state.privileges
      ? (state.privileges[storyID] || [])
      : [],
  may: (state, getters) => (doSomething, storyID) =>
    state.privileges && (state.privileges.superadmin || getters.privilegesForStory(storyID).includes(doSomething)),
}

export const mutations = {
  setProfile: (state, profile) => {
    state.profile = { ...profile }
  },
  setPrivileges: (state, privileges) => {
    state.privileges = { ...privileges }
  },
  eraseProfile: (state) => {
    state.profile = null
  },
}

export const actions = {
  async queryProfile({ commit }) {
    const response = await this.$axios.$get('https://proc.mastory.io/content-editor/user/profile')
    if (response.success) {
      const profile = { ...response }
      delete profile.success
      commit('setProfile', profile)
    }
  },
  async queryPrivileges({ commit }) {
    const response = await this.$axios.$get('https://proc.mastory.io/content-editor/user/privileges')
    if (response.success) {
      commit('setPrivileges', response.privileges)
    }
  },
  async updateProfile({ commit }, newData) {
    const response = await this.$axios.$post('https://proc.mastory.io/content-editor/user/profile', newData)
    if (response.success) {
      commit('setProfile', newData)
    }
  },
}
