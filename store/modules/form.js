const state = {
    item: {},
    schema: {},
};
const mutations = {
    setItem(state, payload) {
        state.item = payload;
    },
    setSchema(state, payload) {
        state.schema = payload;
    }
};
const getters = {};
const actions = {};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}