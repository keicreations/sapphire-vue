<template>
    <div>
        <b-btn variant="primary" class="shadow mb-2" @click="toggleVisible">
            <font-awesome-icon :icon="[visible ? 'fas' : 'fad', 'filter']"/>
        </b-btn>
        <b-collapse v-model="visible" class="mb-2 shadow center">
            <b-card header-bg-variant="primary" header="Filters" header-class="font-weight-bold p-2">
                <ResourceForm
                    @input="updateParameters"
                    form-class="d-flex flex-row flex-wrap"
                    item-class="mr-2 mb-1 filter-item"
                    :show-title="false"
                    :show-submit-button="false"
                    :enable-validation="false"
                    :is-postable="false"
                    :show-non-writable-fields="true"
                    :resource-identifier="resourceIdentifier"
                    :schema="schema"
                    :data="defaultFilters"
                />
            </b-card>
        </b-collapse>
    </div>
</template>

<script>
import _ from 'lodash';
import ResourceForm from "../api-resource/ResourceForm";

export default {
    name: "ResourceFilters",
    components: {ResourceForm},
    data() {
        return {
            visible: false,
        }
    },
    computed: {
        schema() {
            if (!this.filters || !this.apiSchema?.['hydra:supportedClass']) {
                return {};
            }
            if (!this.resourceIdentifier) {
                return this.userSchema;
            }
            if (_.isEmpty(this.userSchema) && this.filters.length) {
                return this.getFormSchema(this.filters);
            }
            if (_.isArray(this.userSchema)) {
                return this.getFormSchema(this.userSchema);
            }
            let schema = {};
            for (const [field, overrides] of Object.entries(this.userSchema)) {
                const item = this.getSchemaItem(field);
                schema[field] = {
                    ...item, ...overrides
                }
            }
            return schema;
        },
        apiSchema() {
            return this.$store.state.app.apiSchema;
        }
    },
    props: {
        resourceIdentifier: {
            type: String,
        },
        filters: {
            type: Array,
            default: () => [],
        },
        enableDebounce: {
            type: Boolean,
            default: true,
        },
        debounceDelay: {
            type: Number,
            default: 500,
        },
        userSchema: {
            type: [Array, Object],
        },
        defaultFilters: {
            type: Object,
            default: () => {},
        }
    },
    created() {
        if (this.defaultFilters) {
            this.visible = true;
        }
        if (this.enableDebounce) {
            this.updateParameters = _.debounce(this.updateParameters, this.debounceDelay);
        }
    },
    methods: {
        toggleVisible() {
            this.visible = !this.visible;
        },
        getFormSchema(fields) {
            let schema = {};
            for (const field of fields) {
                schema[field] = this.getSchemaItem(field);
            }
            return schema;
        },
        getSchemaItem(field) {
            const resource = this.apiSchema['hydra:supportedClass'].find(item => item['@id'] === '#' + this.resourceIdentifier);
            const property = resource['hydra:supportedProperty'].find(item => item['hydra:title'] === field);
            const range = property?.['hydra:property']?.range;
            if (!range) {
                return item;
            }
            let overrideType = null;
            if (range.startsWith('#')) {
                overrideType = 'multiselect';
            } else {
                switch (range) {
                    case 'xmls:dateTime':
                    case 'kei:date':
                        overrideType = 'daterange'
                        break;
                    case 'xmls:boolean':
                    case 'boolean':
                        overrideType = 'checkboxfilter';
                        break;
                    case 'xmls:string':
                        if (property['hydra:property']['constraints']?.some(item => item.constraint === 'Choice')) {
                            overrideType = 'multiselect'
                        }
                }
            }
            let item = {};
            if (overrideType) {
                item.type = overrideType;
            }
            return item;
        },
        updateParameters(data) {
            let parameters = {};
            _.forOwn(data, (value, key) => {
                if (_.isPlainObject(value)) {
                    if (value.before) {
                        parameters[key + '[before]'] = value.before;
                    }
                    if (value.after) {
                        parameters[key + '[after]'] = value.after;
                    }
                } else {
                    parameters[key] = value;
                }
            });
            this.$emit('update-parameters', parameters);
        },
    }
}
</script>

<style scoped>

</style>