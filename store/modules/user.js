import jwt_decode from 'jwt-decode';
import api from './../../lib/api-platform';

const state = {
    token: null,
    refreshToken: null,
    expiresAt: null,
    userId: null,
    user: null,
};

const mutations = {
    setUser(state, user) {
        state.user = user;
    },
    setToken(state, token) {
        if (token === null) {
            localStorage.removeItem('token');
        } else {
            localStorage.setItem('token', token);
        }
        state.token = token;

        if (typeof token !== 'undefined' && token !== null) {
            let payload = jwt_decode(token);
            state.userId = payload.user_id;
            state.expiresAt = payload.exp;
            api.authenticated().get('/api/users/' + state.userId).then(response => {
                state.user = response.data;
            });
        } else {
            state.user = null;
            state.userId = null;
            state.expiresAt = null;
        }
    },
    setRefreshToken(state, refreshToken) {
        if (refreshToken === null) {
            localStorage.removeItem('refreshToken');
        } else {
            localStorage.setItem('refreshToken', refreshToken);
        }
        state.refreshToken = refreshToken;

    },
    setUserId(state, userId) {
        state.userId = userId;
    }
};

const getters = {};
const actions = {
    clear(context) {
        context.commit('setRefreshToken', null);
        context.commit('setToken', null);
    },
    useRefreshToken(context) {
        return new Promise((resolve, reject) => {
            api.anonymous().post('/token/refresh', {
                'refresh_token': context.state.refreshToken
            }).then(response => {
                context.commit('setToken', response.data.token);
                resolve(response.data.token);
            }).catch(error => {
                reject(error);
            });
        });

    },
    loadToken(context) {
        context.commit('setToken', localStorage.getItem('token'));
    },
    loadRefreshToken(context) {
        context.commit('setRefreshToken', localStorage.getItem('refreshToken'));
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
