<template>

</template>

<script>
    import Loading from "./../ui/Loading";
    import api from "./../../lib/api-platform";

    export default {
        name: "ResourceCollection",
        components: {Loading},
        props: {
            uri: {
                type: String,
                required: true,
            },
            params: {
                type: Object,
                default: () => {},
            },
            order: {
                type: Object,
                default: () => {},
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
                this.$emit('refresh', response.data);
                let mercureHub = response.headers.link.match(/<([^>]+)>;\s+rel="[^"]*mercure[^"]*"/);
                if (this.mercureEnabled() && Array.isArray(mercureHub) && mercureHub.length > 1) {
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
                    this.$emit('refresh', response.data);
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
