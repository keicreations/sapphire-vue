<template>
    <div class="resourceList">
        <b-modal ref="delete-confirmation" @ok="onDeleteItem" @cancel="cancelDelete">
            Are you sure you want to delete this item?
        </b-modal>
        <slot name="title">
            <h2 v-if="showTitle">{{ resourceTitle }}
                <b-badge class="ml-3" v-if="showItemCount">{{ itemCount }}</b-badge>
            </h2>
        </slot>
        <slot name="filters">
            <ResourceFilters
                v-if="hasFilters"
                :resource-identifier="resourceIdentifier"
                :filters="availableSearchFilters"
                :default-filters="defaultFilters"
                :user-schema="filterSchema"
                @update-parameters="onFilterParametersChange"
            />
        </slot>
        <b-card :no-body="true" class="resource-list mb-4 shadow">
            <slot v-if="context === null" name="loading">
                <loading />
            </slot>
            <slot name="error" v-else-if="context === '/api/contexts/Error'">
                <div class="p-4">
                    <h3>{{ page['hydra:title'] }}</h3>
                    <p>{{ page['hydra:description'] }}</p>
                </div>
            </slot>
            <table v-else-if="items.length">
                <thead>
                <tr class="bg-primary">
                    <th v-for="(value, name, index) of fields" :key="index" class="pt-2 pb-2"
                        :class="index === 0 ? 'pl-2' : ''">
                        <span @click="toggleOrder(name)" class="cursor-pointer" v-if="getOrderField(name)">
                            {{ value }}
                            <span class="position-absolute ml-1">
                                <font-awesome-icon :icon="['fad', 'sort']" v-show="!getOrderDirection(name)" />
                                <font-awesome-icon :icon="['fad', 'sort-up']" v-show="getOrderDirection(name) === 'asc'" />
                                <font-awesome-icon :icon="['fad', 'sort-down']" v-show="getOrderDirection(name) === 'desc'"/>
                            </span>
                        </span>
                        <span v-else>
                            {{ value }}
                        </span>
                    </th>
                    <th class="text-right"/>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item of items" :key="item.id" class="border">
                    <td v-for="(value, name, index) of fields" :key="index" class="pb-3 pt-3"
                        :class="index === 0 ? 'pl-2': ''">
                        {{ getFieldValue(item[name]) }}
                    </td>
                    <td class="d-flex flex-row-reverse">
                        <b-button variant="link" v-if="canDelete" @click="onClickDelete(item['@id'])" class="mr-3 mt-3 p-0">
                            <font-awesome-icon :icon="['far', 'trash-alt']"/>
                        </b-button>
                        <b-button :to="contextRoute+'/'+item.id+'/update'" variant="link" v-if="canUpdate" class="mr-3 mt-3 p-0">
                            <font-awesome-icon :icon="['far', 'pencil-alt']"/>
                        </b-button>
                        <b-button :to="contextRoute+'/'+item.id+'/view'" variant="link" v-if="canView" class="mr-3 mt-3 p-0">
                            <font-awesome-icon :icon="['far', 'eye']"/>
                        </b-button>
                    </td>
                </tr>
                </tbody>
            </table>
            <slot name="no-items" v-else>
                <div class="text-center py-4">No items found</div>
            </slot>
        </b-card>
        <div class="d-flex">
            <div class="flex-grow-1">
                <b-pagination class="mb-0" v-if="showPagination && items !== null" v-model="currentPage" size="md"
                              @change="setPage" :per-page="getPageSize()" :total-rows="itemCount"/>
            </div>
            <div>
                <b-button v-if="canCreate" :to="contextRoute + '/create'" size="md" type="button" variant="primary">
                    Create
                </b-button>
            </div>
        </div>
    </div>
</template>

<script>
import Loading from "../ui/Loading";
import ResourceCollection from "./ResourceCollection";
import _ from 'lodash';
import ResourceFilters from "../shared/ResourceFilters";
import moment from 'moment';

export default {
    name: "ResourceList",
    components: {ResourceFilters, Loading},
    extends: ResourceCollection,
    data() {
        return {
            itemIriPendingDeletion: null,
        }
    },
    props: {
        listFields: {
            type: [Array, Object],
            required: true,
        },
    },
    methods: {
        getFieldValue(value) {
            if (_.isPlainObject(value) && value['@title']) {
                return value['@title'];
            }
            if (moment(value, moment.ISO_8601).isValid()) {
                return moment(value).calendar();
            }
            return value;
        },
        getSentenceCased(value) {
            return _.upperFirst(_.toLower(_.startCase(value)));
        },
        getUpperFirst(value) {
            return _.upperFirst(value);
        }
    },
    computed: {
        fields() {
            if (_.isPlainObject(this.listFields)) {
                return this.listFields;
            }
            let fields = {};
            for (const field of this.listFields) {
                fields[field] = this.getSentenceCased(field);
            }
            return fields;
        },
        itemCount() {
            return this.page ? this.page['hydra:totalItems'] : null;
        },
        context() {
            return this.page ? this.page['@context'] : null;
        },
        canUpdate() {
            return this.itemActions?.indexOf('update') !== -1;
        },
        canView() {
            return this.itemActions?.indexOf('view') !== -1;
        },
        canDelete() {
            return  this.itemActions?.indexOf('delete') !== -1;
        },
        canCreate() {
            return this.listActions?.indexOf('create') !== -1;
        },
        contextRoute() {
            return this.context ? this.context.replace('/api/contexts', '').toLowerCase().replace(' ', '') : null;
        },
    },
}
</script>

<style scoped>
</style>
