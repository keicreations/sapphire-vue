<template>
    <div />
</template>

<script>
import _ from 'lodash';

export default {
    name: "ResourceCollection",
    props: {
        resourceIdentifier: {
            type: String,
        },
        defaultFilters: {
            type: Object,
            default: () => {},
        },
        defaultOrder: {
            type: Object,
            default: () => {},
        },
        title: {
            type: String,
        },
        uri: {
            type: String,
        },
        filterSchema: {
            type: [Array, Object],
        },
        orderFields: {
            type: Array,
            default: () => [],
        },
        enableFilters: {
            type: Boolean,
            default: true,
        },
        showPagination: {
            type: Boolean,
            default: true,
        },
        customPageSize: {
            type: Number,
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
            order: {},
            params: {},
            items: [],
        }
    },
    beforeDestroy() {
        this.page = null;
        if (this.mercureHandlerId) {
            this.$store.dispatch('mercure/unregisterHandlerId', this.mercureHandlerId);
            this.mercureHandlerId = null;
        }
    },
    computed: {
        apiSchema() {
            return this.$store.state.openApi.apiSchema;
        },
        currentResource() {
            if (this.apiSchema?.['hydra:supportedClass']) {
                return this.apiSchema['hydra:supportedClass'].find(resource => resource['hydra:title'] === this.resourceIdentifier);
            }
            return null;
        },
        itemCount() {
            return this.page?.['hydra:totalItems'];
        },
        resourceTitle() {
            return this.title ?? _.upperFirst(_.toLower(_.startCase(this.resourceIdentifier + 's'))); // *evil laughter*
        },
        availableSearchFilters() {
            return this.currentResource?.['@filters']?.searchable ?? [];
        },
        hasFilters() {
            if (!this.resourceIdentifier) {
                return !!this.filterSchema && this.enableFilters;
            }
            return this.availableSearchFilters.length && this.enableFilters;
        },
        sortableFields() {
            return this.orderFields.length ? this.orderFields : (this.currentResource?.['@filters']?.['sortable'] ?? []);
        },
    },
    created() {
        if (!this.resourceIdentifier && !this.title) {
            throw new Error('Either a resourceIdentifier, or a title has to be set');
        }
        if (this.defaultOrder) {
            for (const [field, direction] of Object.entries(this.defaultOrder)) {
                this.order[field] = direction;
            }
        }
        this.$store.dispatch('openApi/loadApiSchema').then(() => {
            this.$api.authenticated().get(this.getCurrentUri()).then(response => {
                this.page = response.data;
                this.items = response.data['hydra:member'];
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
                if (error.response) {
                    this.page = error.response.data;
                } else if (error.request) {
                    this.page = null;
                } else {
                    throw error;
                }
            });
        })
    },
    methods: {
        onFilterParametersChange(parameters) {
            this.params = parameters;
            this.refresh();
        },
        onDeleteItem() {
            this.$api.authenticated().delete(this.itemIriPendingDeletion).then(() => {
                this.items = this.items.filter(item => item['@id'] !== this.itemIriPendingDeletion);
            }).catch(error => {
                if (error.response?.data?.['hydra:description']) {
                    this.$bvToast.toast(error.response.data['hydra:description'], {
                        title: 'Unable to delete',
                        variant: 'danger'
                    })
                } else {
                    this.$bvToast.toast('Unknown error', {
                        title: 'Unable to delete',
                        variant: 'danger'
                    })
                    throw error;
                }
            }).finally(() => {
                this.itemIriPendingDeletion = null;
            });
        },
        cancelDelete() {
            this.itemIriPendingDeletion = null;
        },
        onClickDelete(iri) {
            this.$refs['delete-confirmation'].show();
            this.itemIriPendingDeletion = iri;
        },
        getOrderDirection(listField) {
            const orderField = this.getOrderField(listField);
            return Object.keys(this.order).includes(orderField) ? this.order[orderField] : null;
        },
        getOrderField(field) {
            const regex = new RegExp('^' + field + '$|^' + field + '[.].*$');
            if (this.sortableFields) {
                return this.sortableFields.find(item => item.match(regex));
            }
            return null;
        },
        toggleOrder(listField) {
            const orderField = this.getOrderField(listField);
            if (Object.keys(this.order).includes(orderField)) {
                if (this.order[orderField] === 'desc') {
                    this.order[orderField] = 'asc';
                } else {
                    delete this.order[orderField];
                }
            } else {
                this.order[orderField] = 'desc';
            }
            this.refresh();
        },
        setPage(payload) {
            this.currentPage = payload;
            this.refresh();
        },
        getCurrentUri() {
            let uri = this.uri ?? (this.apiSchema['hydra:entrypoint'] + this.currentResource?.['@endpoint']);
            if (!uri) {
                return null;
            }
            if (uri.includes('?')) {
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
                for (let [field, direction] of Object.entries(this.order)) {
                    params.append('order[' + field + ']', direction);
                }
            }
            params.set('itemsPerPage', this.getPageSize())
            params.set('page', this.currentPage);

            return uri + '?' +  params.toString();
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
            this.$api.authenticated().get(this.getCurrentUri()).then(response => {
                this.page = response.data;
                this.items = response.data['hydra:member'];
                this.$emit('refresh', response.data);
            }).catch(error => {
                if (error.response) {
                    this.page = error.response.data;
                }
                else if (error.request) {
                    this.page = null;
                }
                else {
                    throw error;
                }
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
