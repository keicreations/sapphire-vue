import Vue from 'vue';
import Vuex from 'vuex';
import user from './modules/user';
import mercure from './modules/mercure';
import api from './../lib/api-platform'

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        user,
        mercure,
    },
    actions: {
        login(context, payload) {
            return new Promise(function (resolve, reject) {
                api.anonymous().post('/authentication_token', {
                    email: payload.username,
                    password: payload.password,
                }).then(response => {
                    context.dispatch('user/setToken', response.data.token);
                    context.dispatch('user/setRefreshToken', response.data.refresh_token);
                    context.dispatch('mercure/setToken', response.data.mercure_token);

                    resolve();
                }).catch(reason => {
                    context.dispatch('user/setToken', null);
                    context.dispatch('user/setRefreshToken', null);
                    context.dispatch('mercure/setToken', null);

                    reject(reason.response);
                });
            });
        },
    }
});
