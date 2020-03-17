const state = {
    token: null,
    tokenKey: 'mercureToken',
};
const getters = {};
const actions = {
    loadToken(context) {
        context.commit('setToken', localStorage.getItem(context.state.tokenKey));
    },
    clear(context) {
        context.commit('setToken', null);
    },
    setToken(context, token) {
        if (token === null) {
            localStorage.removeItem(context.state.tokenKey);
        } else {
            localStorage.setItem(context.state.tokenKey, token);
        }
        context.commit('setToken', token);
    }
};
const mutations = {
    setToken(state, token) {
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
