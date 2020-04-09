<template>
    <div class="resource-item">
        <h2 v-if="title">{{ title }}</h2>
        <slot name="loading" v-if="item === null">
            <loading></loading>
        </slot>
        <slot v-else :item="item" name="item"></slot>
    </div>
</template>

<script>
    import api from '@keicreations/sapphire-vue/lib/api-platform';
    import Loading from "./../ui/Loading";

    export default {
        name: "ResourceItem",
        components: {Loading},
        props: {
            uri: {
                type: String,
                required: true,
            },
            title: {
                type: String,
                required: false,
                default: null,
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
            },
            beforeDelete: {
            },
        },
        data() {
            return {
                item: null,
                context: null,
                mercureHandlerId: null,
            }
        },
        created() {
            api.authenticated().get(this.uri).then(response => {
                this.item = response.data;
                this.context = response.data['@context'];
                this.$emit('refresh', response.data);
                let mercureHub = response.headers.link.match(/<([^>]+)>;\s+rel="[^"]*mercure[^"]*"/);
                if (this.mercureEnabled && Array.isArray(mercureHub) && mercureHub.length > 1) {
                    let payload = {
                        hub: mercureHub[1].split('?')[0],
                        topic: process.env.VUE_APP_API_URL + this.item['@id'],
                        handler: this.handleMercureEvent
                    };
                    this.$store.dispatch('mercure/registerHandler', payload).then(id => {
                        this.mercureHandlerId = id;
                    });
                }
            })
        },
        beforeDestroy() {
            this.item = null;
            if (this.mercureHandlerId) {
                this.$store.dispatch('mercure/unregisterHandlerId', this.mercureHandlerId)
                this.mercureHandlerId = null;
            }
        },
        computed: {
            contextRoute() {
                return this.context ? this.context.replace('/api/contexts', '').toLowerCase().replace(' ', '') : null;
            },
        },
        methods: {
            replace(payload) {
                let oldItem = this.item;
                if (typeof this.beforeCreate === "function") {
                    if (!this.beforeUpdate(payload, oldItem)) {
                        return;
                    }
                }

                this.item = payload;
                this.$emit('update', payload, oldItem);
            },
            append(payload) {
                if (typeof this.beforeCreate === "function") {
                    if (!this.beforeCreate(payload)) {
                        return;
                    }
                }
                this.item = payload;
                this.$emit('create', payload);

            },
            delete(payload) {
                this.item = null;
                this.$emit('delete', payload);
            },
            refresh() {
                api.authenticated().get(this.uri).then(response => {
                    this.item = response.data;
                    this.context = response.data['@context'];
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
                if (this.item['@id'] === eventData['@id']) {
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
        }
    }
</script>

<style scoped>

</style>
