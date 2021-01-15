import Vue from 'vue';
import Vuex from 'vuex';
import user from './modules/user';
import mercure from './modules/mercure';
import toasts from "./modules/toasts";
import openApi from './modules/open-api';
import api from '../lib/api-platform.js';

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        mercure,
        toasts,
        openApi,
    },
    state: {
        authEndpoint: '/authentication_token'
    },
    mutations: {
        setAuthEndpoint(state, payload) {
            state.authEndpoint = payload;
        }
    },
    actions: {
        login(context, payload) {
            return new Promise((resolve, reject) => {
                api.anonymous().post(context.state.authEndpoint, {
                    email: payload.username,
                    password: payload.password,
                }).then(response => {
                    context.dispatch('user/setToken', response.data.token).then(() => {
                        context.dispatch('user/setRefreshToken', response.data.refresh_token);
                        context.dispatch('mercure/setRefreshToken', response.data.refresh_token);
                        context.dispatch('mercure/useRefreshToken');
                        resolve();
                    });
                }).catch(reason => {
                    context.dispatch('user/setToken', null);
                    context.dispatch('user/setRefreshToken', null);
                    context.dispatch('mercure/setToken', null);
                    context.dispatch('mercure/setRefreshToken', null);

                    reject(reason.response);
                });
            });
        },
    }
});
