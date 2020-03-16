const state = {
    token: null,
    tokenKey: 'mercureToken',
};
const getters = {};
const actions = {
    loadToken(context) {
        context.commit('setToken', localStorage.getItem(this.tokenKey));
    },
    clear(context) {
        context.commit('setToken', null);
    },
};
const mutations = {
    setToken(state, token) {
        if (token === null) {
            localStorage.removeItem(this.tokenKey);
        } else {
            localStorage.setItem(this.tokenKey, token);
        }
        state.token = token;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
