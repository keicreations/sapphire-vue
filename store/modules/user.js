import jwt_decode from 'jwt-decode';
import api from './../../lib/api-platform';

const state = {
    token: null,
    tokenKey: 'token',
    refreshToken: null,
    refreshTokenKey: 'refreshToken',
    userUri: '/api/users/me',
    user: null,
};

const mutations = {
    setUser(state, user) {
        state.user = user;
    },
    setToken(state, token) {
        state.token = token;
    },
    setRefreshToken(state, refreshToken) {
        state.refreshToken = refreshToken;
    },
    setUserId(state, userId) {
        state.userId = userId;
    },
    setUserUri(state, uri) {
        state.userUri = uri;
    }
};

const getters = {};
const actions = {
    clear(context) {
        context.dispatch('setRefreshToken', null);
        context.dispatch('setToken', null).catch(()=>{});
    },
    useRefreshToken(context) {
        return new Promise((resolve, reject) => {
            api.anonymous().post('/token/refresh', {
                'refresh_token': context.state.refreshToken
            }).then(response => {
                context.dispatch('setToken', response.data.token);
                resolve(response.data.token);
            }).catch(error => {
                context.dispatch('clear');
                reject(error);
            });
        });
    },
    storeToken(context, token) {
        if (token === null) {
            localStorage.removeItem(context.state.tokenKey);
        } else {
            localStorage.setItem(context.state.tokenKey, token);
        }
        context.commit('setToken', token);
    },
    loadToken(context) {
        return context.dispatch('setToken', localStorage.getItem(context.state.tokenKey));
    },
    readToken(context) {
        context.commit('setToken', localStorage.getItem(context.state.tokenKey));
    },
    setRefreshToken(context, refreshToken) {
        if (refreshToken === null) {
            localStorage.removeItem(context.state.refreshTokenKey);
        } else {
            localStorage.setItem(context.state.refreshTokenKey, refreshToken);
        }
        context.commit('setRefreshToken', refreshToken);
    },
    loadRefreshToken(context) {
        context.commit('setRefreshToken', localStorage.getItem(context.state.refreshTokenKey));
    },
    setToken(context, token) {
        return new Promise((resolve, reject) => {
            context.dispatch('storeToken', token);

            if (typeof token !== 'undefined' && token !== null) {
                let payload = jwt_decode(token);
                context.dispatch('setUser', payload.user_id).then(resolve).catch(reject);
            } else {
                context.dispatch('setUser', null);
                reject();
            }
        });
    },
    setUserUri(context, uri) {
        context.commit('setUserUri', uri);
    },
    setUser(context, userId) {
        return new Promise((resolve, reject) => {
            if (userId === null || typeof userId === 'undefined') {
                context.commit('setUser', null);
                resolve();
            }
            else {
                api.authenticated().get(context.state.userUri).then(response => {
                    context.commit('setUser', response.data);
                    resolve();
                }).catch(() => {
                    context.commit('setUser', null);
                    reject();
                });
            }

        });
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
