<template>
    <div class="resourceGrid">
        <div v-if="title" class="d-flex align-items-center">
            <h2 class="flex-grow-1">{{ title }}<b-badge class="ml-3" v-if="showItemCount">{{ itemCount }}</b-badge></h2>
        </div>
        <b-row :no-gutters="noGutters" class="mb-4">
            <b-col cols="12" v-if="items === null">
                <slot name="loading">
                    <loading ></loading>
                </slot>
            </b-col>
            <b-col :col="col" :cols="cols" :xs="xs" :sm="sm" :md="md" :lg="lg" :key="item.id" v-else-if="items.length" v-for="item in items">
                <slot :item="item" name="item">
                    <b-card :to="canView ? contextRoute+'/'+item.id+'/view' : null" class="item">
                        <div class="display">{{item[displayProperty]}}</div>
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
                    </b-card>
                </slot>
            </b-col>
            <b-col cols="12" v-else>
                <slot name="no-items">
                    <div class="text-center py-4">
                        No items found
                    </div>
                </slot>
            </b-col>
        </b-row>
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
        name: "ResourceGrid",
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
            noGutters: {
                type: Boolean,
                default: false,
            },
            xs: {
                type: String,
            },
            sm: {
                type: String,
            },
            md: {
                type: String,
            },
            lg: {
                type: String,
            },
            cols: {
                type: String,
            },
            col: {
                type: Boolean,
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
