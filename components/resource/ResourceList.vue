<template>
    <div class="resourceList">
        <div v-if="title" class="d-flex align-items-center">
            <h2 class="flex-grow-1">{{ title }}<b-badge class="ml-3" v-if="showItemCount">{{ itemCount }}</b-badge></h2>
        </div>
        <b-card :no-body="true" class="resource-list mb-4">
            <loading v-if="items === null"></loading>
            <b-list-group flush v-else-if="items.length > 0">
                <b-list-group-item :to="canView ? contextRoute+'/'+item.id+'/view' : null" :key="item.id" v-for="item in items">
                    <div class="item">
                        <slot :item="item" name="item">
                            <div class="display">{{item[displayProperty]}}</div>
                        </slot>
                        <div class="action" v-if="canUpdate">
                            <b-button :to="contextRoute+'/'+item.id+'/update'" variant="link">
                                <font-awesome-icon :icon="['far', 'pencil-alt']"/>
                            </b-button>
                        </div>
                        <div class="action" v-if="canDelete">
                            <b-button variant="link">
                                <font-awesome-icon :icon="['far', 'trash-alt']"/>
                            </b-button>
                        </div>
                    </div>
                </b-list-group-item>
            </b-list-group>
            <div class="text-center py-4" v-else>No items found</div>
        </b-card>
        <div class="d-flex">
            <div class="flex-grow-1">
                <b-pagination class="mb-0" v-if="showPagination && items !== null" v-model="currentPage" size="md" @change="setPage" :per-page="getPageSize()" :total-rows="itemCount">

                </b-pagination>
            </div>
            <div>
                <b-button v-if="canCreate" :to="contextRoute + '/create'" size="md" type="button" variant="primary">Create</b-button>
            </div>
        </div>
    </div>
</template>

<script>
    import Loading from "./../ui/Loading";
    import api from "./../../lib/api-platform";
    import {EventSourcePolyfill} from 'event-source-polyfill';

    export default {
        name: "ResourceList",
        components: {Loading},
        props: {
            title: {
                type: String,
                required: false,
                default: null,
            },
            uri: {
                type: String,
                required: true,
            },
            displayProperty: {
                type: String,
                required: true,
            },
            itemActions: {
                type: Array,
                default: () => [],
            },
            params: {
                type: Object,
                default: () => {},
            },
            order: {
                type: Object,
                default: () => {},
            },
            showItemCount: {
                type: Boolean,
                required: false,
                default: false,
            },
            showPagination: {
                type: Boolean,
                required: false,
                default: true,
            },
            customPageSize: {
                type: Number,
                required: false,
            },
            listActions: {
                type: Array,
                default: () => [],
            },
            mercure: {
                type: String,
            },
            mercureCreate: {
                type: String
            },
            mercureUpdate: {
                type: String
            },
            mercureDelete: {
                type: String
            },
            beforeCreate: {
            },
            beforeUpdate: {

            }
        },
        data() {
            return {
                page: null,
                mercureHandlerId: null,
                currentPage: 1,
                pageSize: 24,
            }
        },
        created() {
            api.authenticated().get(this.currentUri).then(response => {
                this.page = response.data;
                let mercureHub = response.headers.link.match(/<([^>]+)>;\s+rel="[^"]*mercure[^"]*"/);
                if (this.mercureEnabled && Array.isArray(mercureHub) && mercureHub.length > 1) {
                    let topic = process.env.VUE_APP_API_URL + this.page['@id'] + '/{id}';
                    let payload = {
                        hub: mercureHub[1].split('?')[0],
                        topic: topic,
                        handler: this.handleMercureEvent
                    };

                    this.$store.dispatch('mercure/registerHandler', payload).then(id => {
                        this.mercureHandlerId = id;
                    });
                }
            }).catch(error => {
                if (error.request || error.response) {
                    this.page = null;
                }
                else {
                    throw error;
                }
            });
        },
        beforeDestroy() {
            this.page = null;
            if (this.mercureHandlerId) {
                this.$store.dispatch('mercure/unregisterHandlerId', this.mercureHandlerId);
                this.mercureHandlerId = null;
            }
        },
        computed: {
            items() {
                return this.page ? this.page['hydra:member'] : null;
            },
            itemCount() {
                return this.page ? this.page['hydra:totalItems'] : null;
            },
            context() {
                return this.page ? this.page['@context'] : null;
            },
            canUpdate() {
                return this.itemActions && this.itemActions.indexOf('update') !== -1;
            },
            canView() {
                return this.itemActions && this.itemActions.indexOf('view') !== -1;
            },
            canDelete() {
                return this.itemActions && this.itemActions.indexOf('delete') !== -1;
            },
            canCreate() {
                return this.listActions && this.listActions.indexOf('create') !== -1;
            },
            contextRoute() {
                return this.context ? this.context.replace('/api/contexts', '').toLowerCase().replace(' ', '') : null;
            },
            currentUri() {
                if (this.uri.includes('?')) {
                    throw new Error('Uri cannot contain the ? character, please use the params prop to supply query parameters');
                }
                let params = new URLSearchParams();
                let reservedParams = [
                    'order',
                    'itemsPerPage',
                ];
                if (this.params) {
                    for (let [key, value] of Object.entries(this.params)) {
                        if (reservedParams.indexOf(key) !== -1) {
                            throw new Error(key + ' is a reserved param, please use the correct prop to set the value(s).');
                        }
                        if (typeof value === 'object') {
                            for (let [subKey, subValue] of Object.entries(value)) {
                                params.append(key + '[' + subKey + ']', subValue);
                            }
                        } else {
                            params.set(key, value);
                        }
                    }
                }
                if (this.order) {
                    for (let [subKey, subValue] of Object.entries(this.order)) {
                        params.append('order[' + subKey + ']', subValue);
                    }
                }
                params.set('itemsPerPage', this.getPageSize())
                params.set('page', this.currentPage);

                return this.uri + '?' +  params.toString();
            },
        },
        methods: {
            setPage(payload) {
                this.currentPage = payload;
                this.refresh();
            },
            replace(payload) {
                let index = this.items.findIndex(item => item['@id'] === payload['@id']);
                if (index !== -1) {
                    let oldItem = this.items[index];
                    if (typeof this.beforeCreate === "function") {
                        if (!this.beforeUpdate(payload, oldItem)) {
                            return;
                        }
                    }
                    this.items.splice(index, 1, payload);
                    this.$emit('update', payload, oldItem);
                }
                else {
                    console.log('Could not find: ' + payload['@id']);
                }
            },
            append(payload) {
                if (typeof this.beforeCreate === "function") {
                    if (!this.beforeCreate(payload)) {
                        return;
                    }
                }
                this.items.push(payload);
                this.$emit('create', payload);

            },
            delete(payload) {
                this.items = this.items.filter(item => {
                    return item['@id'] !== payload['@id'];
                });
                this.$emit('delete', payload);
            },
            refresh() {
                api.authenticated().get(this.currentUri).then(response => {
                    this.page = response.data;
                    this.$emit('refresh', response);
                });
            },
            handleMercureEvent(event) {
                let payload = JSON.parse(event.data);
                let method = this.getMercureChangeMethod(payload);

                if (this.getMercureHandlerMethod(method) === 'refresh') {
                    this.refresh()
                } else if (this.getMercureHandlerMethod(method) === 'modify') {
                    switch (method) {
                        case 'create':
                            this.append(payload);
                            break;
                        case 'update':
                            this.replace(payload);
                            break;
                        case 'delete':
                            this.delete(payload);
                            break;
                        default:
                            console.log('Unknown method "' + method + '" for modify on "' + payload['@id'] + '"');
                    }
                }
            },
            mercureEnabled() {
                if (this.mercure) {
                    return true;
                }
                if (
                    (this.mercureCreate && this.mercureCreate !== 'ignore')
                    ||
                    (this.mercureUpdate && this.mercureUpdate !== 'ignore')
                    ||
                    (this.mercureDelete && this.mercureDelete !== 'ignore')
                ) {
                    return true;
                }
                return false;
            },
            getMercureChangeMethod(eventData) {
                if (Object.keys(eventData).length === 1) {
                    return 'delete';
                }
                let index = -1;
                if (this.items !== null) {
                    index = this.items.findIndex(item => {
                        return item['@id'] === eventData['@id']
                    });
                }
                if (index !== -1) {
                    return 'update';
                }
                return 'create';
            },
            getMercureHandlerMethod(method) {
                switch (method) {
                    case 'create':
                        return this.mercureCreate ? this.mercureCreate : this.mercure;
                    case 'update':
                        return this.mercureUpdate ? this.mercureUpdate : this.mercure;
                    case 'delete':
                        return this.mercureDelete ? this.mercureDelete : this.mercure;
                }
            },
            getPageSize() {
                return this.customPageSize ? this.customPageSize : this.pageSize;
            },
        },
    }
</script>

<style scoped>

</style>
