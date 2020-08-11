import api from './lib/api-platform.js';
import ResourceGrid from "./components/resource/ResourceGrid";
import ResourceCollection from "./components/resource/ResourceCollection";
import ResourceItem from "./components/resource/ResourceItem";
import ResourceList from "./components/resource/ResourceList";

export default {
    install(Vue, options) {
        // // 1. add global method or property
        // Vue.myGlobalMethod = function () {
        //     // some logic ...
        // }

        // 2. add a global asset
        // Vue.directive('my-directive', {
        //     bind (el, binding, vnode, oldVnode) {
        //         // some logic ...
        //     }
        // })

        Vue.component('ResourceGrid', ResourceGrid);
        Vue.component('ResourceList', ResourceList);
        Vue.component('ResourceItem', ResourceItem);
        Vue.component('ResourceCollections', ResourceCollection);

        // 3. inject some component options
        // Vue.mixin({
        //     created: function () {
        //         // some logic ...
        //     }
        // })

        // 4. add an instance method
        Vue.prototype.$api = options.api ? options.api : api;
    }
}
