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
        login(context, username, password) {
            return new Promise(function (resolve, reject) {
                api.anonymous().post('/authentication_token', {
                    email: username,
                    password: password
                }).then(response => {
                    context.commit('user/setToken', response.data.token);
                    context.commit('user/setRefreshToken', response.data.refresh_token);
                    context.commit('mercure/setToken', response.data.mercure_token);

                    resolve();
                }).catch(reason => {
                    context.commit('user/setToken', null);
                    context.commit('user/setRefreshToken', null);
                    context.commit('mercure/setToken', null);

                    reject(reason.response);
                });
            });
        }
    }
});
