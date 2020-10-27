const state = {
    toasts: [],
};
const mutations = {
    addToast(state, toast) {
        state.toasts.push(toast);
    },
    removeToast(state, index) {
        state.toasts.splice(index, 1);
    },
    markToastRead(state, index) {
        state.toasts[index].read = true;
    }
};
const actions = {
    addToast(context, toast) {
        if (!context.state.toasts.some(item => item.message === toast.message)) {
            context.commit('addToast', toast);
        }
    },
    markToastRead(context, index) {
        context.commit('markToastRead', index);
        setTimeout(() => {
            context.commit('removeToast', index);
        }, context.state.toasts[index].autoHideDelay || 5000)
    }
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
}
