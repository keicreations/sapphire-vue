<template>
    <b-card :no-body="items !== null" class="resource-list">
        <b-card-header class="d-flex">
            <div class="flex-grow-1">{{ resource }}</div>
            <b-badge class="ml-3">{{ itemCount }}</b-badge>
        </b-card-header>
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
        <b-card-footer v-if="canCreate && items !== null">
            <b-button :to="contextRoute + '/create'" size="lg" type="button" variant="primary">Create</b-button>
        </b-card-footer>
    </b-card>
</template>

<script>
    import Loading from "./../ui/Loading";
    import api from "./../../lib/api-platform";
    import {EventSourcePolyfill} from 'event-source-polyfill';

    export default {
        name: "ResourceList",
        components: {Loading},
        props: {
            resource: {
                type: String,
                required: true,
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
                mercureHub: null,
                mercureEventSource: null,
            }
        },
        created() {
            api.authenticated().get(this.uri).then(response => {
                this.page = response.data;
                let mercureTopic = response.headers.link.match(/<([^>]+)>;\s+rel="[^"]*mercure[^"]*"/);
                if (this.mercureEnabled && mercureTopic) {
                    this.mercureHub = new URL(mercureTopic[1].split('?')[0]);
                    let topic = process.env.VUE_APP_API_URL + this.page['@id'] + '/{id}';
                    this.mercureHub.searchParams.append('topic', topic);
                    this.mercureEventSource = new EventSourcePolyfill(this.mercureHub, {
                        headers: {
                            Authorization: 'Bearer ' + this.$store.state.mercure.token
                        }
                    });
                    this.mercureEventSource.onmessage = this.handleMercureEvent;
                }
            }).catch(error => {
                this.page = null;
            });
        },
        destroyed() {
            this.page = null;
            if (this.mercureEventSource !== null) {
                this.mercureEventSource.close();
                this.mercureEventSource = null;
            }
            this.mercureHub = null;
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
        },
        methods: {
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
                api.authenticated().get(this.uri).then(response => {
                    this.items = response.data['hydra:member'];
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
            }
        },
    }
</script>

<style scoped>

</style>
