const state = {
    toasts: [],
};
const mutations = {
    addToast(state, toast) {
        state.toasts.push(toast);
    },
    removeToast(state, index) {
        state.toasts.splice(index, 1);
    }
};

export default {
    namespaced: true,
    state,
    mutations,
}
