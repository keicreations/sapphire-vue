import {EventSourcePolyfill} from "event-source-polyfill";

const state = {
    token: null,
    tokenKey: 'mercureToken',
    handlers: [],
    eventSource: null,
    currentMercureUri: null,
    handlerLastId: 1,
};
const getters = {
    calculatedMercureUri: (state) => {
        if (state.handlers.length === 0) {
            return null;
        }
        let url = new URL(state.handlers[0].hub);
        let topics = [];

        state.handlers.forEach(payload => topics.push(payload.topic));
        topics = [...new Set(topics)];
        topics.forEach(topic => url.searchParams.append('topic', topic));

        return url;
    },
    currentHub: (state) => {
        return state.handlers.length ? state.handlers[0].hub : null;
    },
    handler: (state) => (event) => {
        state.handlers.forEach((payload) => {
            let data = JSON.parse(event.data);
            let expected = payload.topic.replace(process.env.VUE_APP_API_URL, '');
            let actual = data['@id'];

            if (expected.endsWith('/{id}')) {
                expected = expected.replace('/{id}', '');
                let actualParts = actual.split('/');
                actualParts.pop();
                actual = actualParts.join('/');
                if (actual === expected) {
                    payload.handler(event);
                }
            }
            else if (expected === actual) {
                payload.handler(event);
            }
        });
    },
};
const actions = {
    getId(context) {
        context.commit('increment');
    },
    loadToken(context) {
        context.commit('setToken', localStorage.getItem(context.state.tokenKey));
    },
    clear(context) {
        context.commit('setToken', null);
    },
    setToken(context, token) {
        if (token === null) {
            localStorage.removeItem(context.state.tokenKey);
        } else {
            localStorage.setItem(context.state.tokenKey, token);
        }
        context.commit('setToken', token);
    },
    registerHandler(context, payload) {
        let id = context.state.handlerLastId;
        payload.id = id;
        context.commit('incrementHandlerId');
        context.commit('addHandler', payload);
        // if (process.env.NODE_ENV !== 'production') {
        //     console.log('[Mercure] Current handler count: ' + context.state.handlers.length);
        // }

        context.dispatch('connect');

        return id;
    },
    unregisterHandlerId(context, id) {
        context.commit('removeHandlerId', id);

        // if (process.env.NODE_ENV !== 'production') {
        //     console.log('[Mercure] Current handler count: ' + context.state.handlers.length);
        // }

        if (context.state.handlers.length === 0) {
            context.dispatch('disconnect');
        }
        else {
            context.dispatch('connect');
        }
    },
    connect(context, payload) {
        if (context.getters.calculatedMercureUri !== null && (context.state.currentMercureUri === null || context.getters.calculatedMercureUri.toString() !== context.state.currentMercureUri.toString())) {
            context.commit('setCurrentMercureUrl', context.getters.calculatedMercureUri);
            if (context.state.eventSource !== null) {
                context.dispatch('disconnect');
            }
            context.state.eventSource = new EventSourcePolyfill(context.getters.calculatedMercureUri, {
                headers: {
                    Authorization: 'Bearer ' + context.state.token
                }
            });
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Mercure] Connecting to "' + context.getters.calculatedMercureUri.toString() + '"');
            }
            context.state.eventSource.onmessage = context.getters.handler;
        }
    },
    disconnect(context) {
        if (context.state.eventSource !== null) {
            context.state.eventSource.close();
            context.state.eventSource = null;
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Mercure] Disconnected');
            }
        }
    },
};
const mutations = {
    incrementHandlerId(state) {
        state.handlerLastId++;
    },
    setToken(state, token) {
        state.token = token;
    },
    setCurrentMercureUrl(state, uri) {
        state.currentMercureUri = uri;
    },
    addHandler(state, handler) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Mercure] Registering handler for topic "' + handler.topic + '" with id "' + handler.id + '"');
        }
        state.handlers.push(handler);
    },
    removeHandlerId(state, id) {
        if (process.env.NODE_ENV !== 'production') {
            let found = false;
            state.handlers.forEach(registeredHandler => {
                if (registeredHandler.id === id) {
                    console.log('[Mercure] Removing handler for topic "' + registeredHandler.topic + '" with id "' + id + '"');
                    found = true;
                }
            })
            if (!found) {
                console.log('[Mercure] Could not remove handler with id "' + id + '" since it is not registered');
            }
        }
        state.handlers = state.handlers.filter(registeredHandler => registeredHandler.id !== id);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
