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
            return new Promise((resolve, reject) => {
                api.anonymous().post('/authentication_token', {
                    email: payload.username,
                    password: payload.password,
                }).then(response => {
                    context.dispatch('user/setToken', response.data.token);
                    context.dispatch('user/setRefreshToken', response.data.refresh_token);
                    context.dispatch('mercure/setRefreshToken', response.data.refresh_token);
                    resolve();
                }).catch(reason => {
                    context.dispatch('user/setToken', null);
                    context.dispatch('user/setRefreshToken', null);
                    context.dispatch('mercure/setToken', null);
                    context.dispatch('mercure/setRefreshToken', null);

                    reject(reason.response);
                });
            });
        },
        loginMercure(context, payload) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Mercure] Getting a token using user refresh_token.');
            }
            return new Promise((resolve, reject) => {
                api.anonymous().post('/mercure/token', {
                    refresh_token: payload
                }).then(response => {
                    context.dispatch('mercure/setToken', response.data.mercure_token)
                    resolve();
                }).catch(reason => {
                    reject(reason.response);
                });
            })
        }
    }
});
