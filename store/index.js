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
    actions: {
        login(context, payload) {
            return new Promise((resolve, reject) => {
                const endpoint = payload.endpoint || '/authentication_token';
                api.anonymous().post(endpoint, {
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
