<template>
    <div class="resourceList">
        <div v-if="title" class="d-flex align-items-center">
            <h2 class="flex-grow-1">{{ title }}<b-badge class="ml-3" v-if="showItemCount">{{ itemCount }}</b-badge></h2>
        </div>
        <b-card :no-body="true" class="resource-list mb-4">
            <slot v-if="context === null" name="loading">
                <loading></loading>
            </slot>
            <slot name="error" v-else-if="context === '/api/contexts/Error'">
                <h3>{{ item['hydra:title'] }}</h3>
                <p>{{ item['hydra:description'] }}</p>
            </slot>
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
            <slot name="no-items" v-else>
                <div class="text-center py-4">No items found</div>
            </slot>
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
    import ResourceCollection from "./ResourceCollection";

    export default {
        name: "ResourceList",
        components: {Loading},
        extends: ResourceCollection,
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
            showItemCount: {
                type: Boolean,
                required: false,
                default: false,
            },
            listActions: {
                type: Array,
                default: () => [],
            },
        },
        computed: {
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
        },
    }
</script>

<style scoped>

</style>
