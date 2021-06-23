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
        async login(context, payload) {
            const endpoint = payload.endpoint || '/authentication_token';
            const response = await api.anonymous().post(endpoint, {
                email: payload.username,
                password: payload.password,
            }).catch(reason => {
                context.dispatch('user/setToken', null);
                context.dispatch('user/setRefreshToken', null);
                context.dispatch('mercure/setToken', null);
                context.dispatch('mercure/setRefreshToken', null);

                return new Promise((reject) => {
                    reject(reason.response);
                })
            });
            await context.dispatch('user/setToken', response.data.token);
            await context.dispatch('user/setRefreshToken', response.data.refresh_token);
            await context.dispatch('mercure/setRefreshToken', response.data.refresh_token);
            await context.dispatch('mercure/useRefreshToken');

            return new Promise((resolve) => {
                resolve();
            });
        },
    }
});
