import api from './lib/api-platform.js';
import ResourceGrid from "./components/resource/ResourceGrid";
import ResourceCollection from "./components/resource/ResourceCollection";
import ResourceItem from "./components/resource/ResourceItem";
import ResourceList from "./components/resource/ResourceList";
import store from "./store/index";
import user from "./store/modules/user";;

export default {
    install(Vue, options) {
        Vue.component('ResourceGrid', ResourceGrid);
        Vue.component('ResourceList', ResourceList);
        Vue.component('ResourceItem', ResourceItem);
        Vue.component('ResourceCollections', ResourceCollection);

        Vue.prototype.$api = (options && options.api) ? options.api : api;

        if(options && options.module && options.module.user){
            store.registerModule('user', options.module.user);
        } else {
            store.registerModule('user', user)
        }
    }
}
