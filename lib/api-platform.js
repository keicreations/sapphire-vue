import axios from 'axios';
import store from '../store/index';
import router from "vue-router";

const baseUrl = process.env.VUE_APP_API_URL;

export default {
    anonymous() {
        return axios.create({
            baseURL: baseUrl,
        })
    },
    authenticated() {
        let instance = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': 'Bearer ' + store.state.user.token,
                'Content-type': 'application/merge-patch+json',
            }
        });

        instance.interceptors.response.use((response) => {
            // Return a successful response back to the calling service
            return response;
        }, (error) => {
            // Return any error which is not due to authentication back to the calling service
            if (error.response.status !== 401) {
                return new Promise((resolve, reject) => {
                    reject(error);
                });
            }

            // Logout user if token refresh didn't work or user is disabled
            if (error.config.url === '/token/refresh' || error.response.data.message === 'Account is disabled.' || error.response.data.message === 'JWT Token not found') {

                store.commit('user/setToken', null);
                store.commit('user/setRefreshToken', null);
                router.push('/');

                return new Promise((resolve, reject) => {
                    reject(error);
                });
            }

            // Try request again with new token
            return store.dispatch('user/useRefreshToken')
                .then((token) => {
                    // New request with new token
                    const config = error.config;
                    config.headers['Authorization'] = `Bearer ${token}`;

                    return new Promise((resolve, reject) => {
                        axios.request(config).then(response => {
                            resolve(response);
                        }).catch((error) => {
                            reject(error);
                        })
                    });

                })
                .catch((error) => {
                    Promise.reject(error);
                });
        });

        return instance;
    }
}
