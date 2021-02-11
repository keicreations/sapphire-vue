import api from '../../lib/api-platform';

const state = {
    apiSchema: null,
};

const mutations = {
    setApiSchema(state, payload) {
        state.apiSchema = payload;
    }
};
const actions = {
    loadApiSchema(context) {
        return new Promise((resolve, reject) => {
            if (context.state.apiSchema) {
                resolve(context.state.apiSchema);
            } else {
                api.anonymous().get('/api/docs').then(response => {
                    context.commit('setApiSchema', response.data);
                    resolve(response.data);
                }).catch(reject);
            }
        });
    },
};

export default {
    namespaced: true,
    state,
    actions,
    mutations,
}