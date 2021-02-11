<template>
    <div>
        <h2 v-if="showTitle">{{resourceTitle}}</h2>
        <FormulateForm
                @submit="onFormSubmit"
                :class="formClass"
                :form-errors="unmappedViolations"
                :errors="mappedViolations"
                :schema="formSchema"
                v-model="formData"
                @input="$emit('input', $event)"
        >
            <FormulateInput
                v-if="showSubmitButton"
                type="submit"
                :label="submitLabel"
                :disabled="busy"
            />
        </FormulateForm>
    </div>
</template>

<script>
    import _ from 'lodash';

    export default {
        name: "ResourceForm",
        data() {
            return {
                unmappedViolations: [],
                mappedViolations: {},
                formSchema: [],
                initialized: false,
                busy: false,
            }
        },
        props: {
            resourceIdentifier: {
                type: String,
            },
            title: {
                type: String,
            },
            uri: {
                type: String,
            },
            id: {
                type: String,
            },
            showTitle: {
                type: Boolean,
                default: true,
            },
            schema: {
                type: [Object, Array],
                default: () => {},
            },
            labelStrategy: {
                type: [Function, String],
                default: 'sentenceCase',
            },
            showNonWritableFields: {
                type: Boolean,
                default: false,
            },
            showSubmitButton: {
                type: Boolean,
                default: true,
            },
            enableValidation: {
                type: Boolean,
                default: true,
            },
            formClass: {
                type: String,
                default: 'item-form card card-body'
            },
            itemClass: {
                type: String,
            },
            submitLabel: {
                type: String,
                default: 'Save',
            },
            data: {
                type: Object,
                default: () => {},
            },
            isPostable: {
                type: Boolean,
                default: true,
            }
        },
        computed: {
            resourceTitle() {
                return this.title ?? (!this.id ? 'Create ' : 'Update ') + this.resourceIdentifier;
            },
            resourceUrl() {
                if (this.uri) {
                    return this.uri;
                }
                if (this.apiSchema) {
                    return this.apiSchema['hydra:entrypoint'] + this.getResource(this.resourceIdentifier)['@endpoint'];
                }
                return null;
            },
            apiSchema() {
                return this.$store.state.openApi.apiSchema;
            },
            formData: {
                get() {
                    return this.data ? {
                        ...this.data,
                        ...this.$store.state.form.item,
                    } : this.$store.state.form.item;
                },
                set(data) {
                    return this.$store.commit('form/setItem', data);
                }
            },
        },
        methods: {
            onFormSubmit(data) {
                this.busy = true;
                this.unmappedViolations = [];
                this.mappedViolations = {};
                const method = this.id ? 'patch' : 'post';
                const url = this.id ? this.resourceUrl + '/' + this.id : this.resourceUrl;
                this.$api.authenticated()[method](url, data, {
                    method,
                }).then(response => {
                    this.$router.replace(this.getReturnPath(response));
                }).catch(error => {
                    if (error.response) {
                        if (error.response.status === 400 && error.response.data['@type'] === 'ConstraintViolationList') {
                            let violations = {};
                            error.response.data.violations.forEach(item => {
                                if (!item.propertyPath) {
                                    this.unmappedViolations.push(item.message);
                                    return;
                                }
                                if (!this.formSchema.some(schemaItem => schemaItem.name === item.propertyPath)) {
                                    this.unmappedViolations.push(
                                        item.propertyPath + ': ' + item.message,
                                    );
                                    return;
                                }
                                violations[item.propertyPath] = item.message;
                            });
                            this.mappedViolations = violations;
                        } else {
                            this.unmappedViolations = [error.response.data['hydra:description']];
                        }
                    } else {
                        this.$bvToast.toast(`${error.statusText}`, {
                            title: 'Error',
                            variant: 'danger',
                            autoHideDelay: 5000,
                        });
                        throw error;
                    }
                }).finally(() => this.busy = false);
            },
            getItemType(properties) {
                if (!properties.range) {
                    throw new Error('Unable to guess type for field: ' + properties['rdfs:label']);
                }
                if (properties.range.startsWith('#')) {
                    let type = 'select';
                    if (!properties['owl:maxCardinality'] || properties['owl:maxCardinality'] > 1) {
                        type = 'checkbox';
                    }
                    return type;
                }
                switch (properties.range) {
                    case 'xmls:string':
                        return 'text';
                    case 'xmls:boolean':
                        return 'checkbox';
                    case 'xmls:dateTime':
                        return 'datetime-local';
                    case 'xmls:integer':
                        return 'integer';
                    case 'kei:array':
                        return 'checkbox';
                    case 'kei:text':
                        return 'textarea';
                    case 'kei:date':
                        return 'date';
                }
                throw new Error('Unknown openApi type: ' + properties.range);
            },
            getFormattedString(value, strategy) {
                try {
                    return strategy(value);
                } catch (error) {
                    switch(strategy) {
                        case 'upperFirst':
                            return _.upperFirst(value);
                        case 'capitalize':
                            return _.capitalize(value);
                        case 'titleCase':
                            return _.startCase(value);
                        case 'snakeCase':
                            return _.snakeCase(value);
                        case 'camelCase':
                            return _.camelCase(value);
                        case 'sentenceCase':
                            return _.upperFirst(_.toLower(_.startCase(value)));
                    }
                }
                throw new Error('Unknown text format: ' + strategy);
            },
            async getSchemaItem(docsField, overrides = null) {
                const fieldName = docsField['hydra:title'];
                let item = {};
                item.name = overrides?.['name'] ?? fieldName;
                item.type = overrides?.type ?? this.getItemType(docsField['hydra:property']);
                if (this.itemClass) {
                    item.class = this.itemClass;
                }
                if (!overrides?.label) {
                    if (item.type !== 'hidden') {
                        item.label = this.getFormattedString(fieldName, this.labelStrategy);
                    }
                } else {
                    item.label = overrides.label;
                }
                const fieldProperties = docsField['hydra:property'];
                if (!overrides?.multiple) {
                    item.multiple = (
                        fieldProperties.range.startsWith('#') && (!fieldProperties['owl:maxCardinality'] || fieldProperties['owl:maxCardinality'] > 1)
                    ) || fieldProperties.range === 'kei:array';
                } else {
                    item.multiple = !!overrides.multiple;
                }
                if (overrides?.validation == null) {
                    if (docsField['hydra:required'] && this.enableValidation) {
                        item.validation = item.type !== 'checkbox' || (item.type === 'checkbox' && item.multiple) ? 'required' : null;
                    }
                } else {
                    item.validation = overrides.validation;
                }
                if (overrides?.options) {
                    item.options = overrides.options;
                }
                if (fieldProperties['constraints']) {
                    if (overrides?.validation == null && this.enableValidation) {
                        item.validation = this.getFullValidationString(fieldProperties['constraints'], item);
                    }
                    if (!item.options) {
                        fieldProperties['constraints'].forEach(constraint => {
                            if (constraint.constraint !== 'Choice') {
                                return;
                            }
                            let options = {};
                            const labelStrategy = overrides?.['_optionLabelStrategy'];
                            constraint.parameters.choices.forEach(choice => {
                                options[choice] = this.getFormattedString(choice, labelStrategy ?? 'sentenceCase');
                            });
                            item.options = options;
                        });
                        if (overrides?.type == null && item.type === 'text') {
                            item.type = item.multiple ? 'checkbox' : 'select';
                        }
                    }
                }
                if (!overrides?.children) {
                    if (item.type === 'group') {
                        item.children = await this.getFormSchema(null, fieldProperties.range.replace('#',''), overrides._schema);
                    }
                } else {
                    item.children = overrides.children;
                }
                if (overrides?.label == null
                    && this.labelStrategy == null
                    && item.validation?.includes('required')
                    && item.type !== 'hidden'
                ) {
                    item.label += '*';
                }
                if (overrides) {
                    _.forOwn(overrides, (value, key) => {
                        if (!key.startsWith('_')) {
                            item[key] = value;
                        }
                    });
                }
                if (item.type === 'select' && !overrides?.placeholder) {
                    item.placeholder = 'Please select...';
                }
                if (!item.options &&
                    (item.multiple || item.type === 'select' || item.type === 'multiselect')
                    && fieldProperties.range !== 'kei:array'
                    && item.type !== 'group'
                ) {
                    const resourceIdentifier = fieldProperties.range.replace('#', '');
                    let endpoint = this.getResource(resourceIdentifier)['@endpoint'];
                    let searchParams = new URLSearchParams();
                    if (overrides?._filters) {
                        for (let [key, value] of Object.entries(overrides._filters)) {
                            if (typeof value === 'object') {
                                for (let [subKey, subValue] of Object.entries(value)) {
                                    searchParams.append(key + '[' + subKey + ']', subValue);
                                }
                            } else {
                                searchParams.set(key, value);
                            }
                        }
                    }
                    if (searchParams.toString()) {
                        endpoint += '?' + searchParams.toString();
                    }
                    const options = await this.fetchItems(endpoint);
                    item.options = this.getChoices(options);
                }
                return item;
            },
            getFullValidationString(constraints, item) {
                let validationRules = [];
                if (item.validation) {
                    validationRules.push(item.validation);
                }
                constraints.forEach(constraint => {
                    const parameters = constraint.parameters;
                    const name = constraint.constraint;
                    switch (name) {
                        case 'Length':
                            if (parameters.min) {
                                validationRules.push('min:' + parameters.min);
                            }
                            if (parameters.max) {
                                validationRules.push('max:' + parameters.max);
                            }
                            break;
                        case 'Email':
                            validationRules.push('email');
                            break;
                        case 'Choice':
                            if (!item.multiple) {
                                validationRules.push('in:' + parameters.choices.join(','));
                            } else {
                                validationRules.push('inOptions:' + parameters.choices.join(','));
                            }
                            break;
                        default:
                            throw new Error('Unknown constraint ' + name);
                    }
                });
                return validationRules.join('|');
            },
            getReturnPath(response) {
                return response.data['@context'].replace('/api/contexts', '').toLowerCase().replace(' ', '');
            },
            getResource(identifier) {
                return this.apiSchema['hydra:supportedClass'].find(resource => resource['@id'] === '#' + identifier);
            },
            getProperty(property, resource) {
                return resource['hydra:supportedProperty'].find(item => item['hydra:title'] === property);
            },
            fetchItems(endpoint) {
                const uri = this.apiSchema['hydra:entrypoint'] + endpoint;
                return new Promise((resolve, reject) => {
                    this.$api.authenticated().get(uri).then(response => {
                        resolve(response.data['hydra:member']);
                    }).catch(() => {
                        this.$bvToast.toast('Unable to load options.', {
                            title: 'Error',
                            variant: 'danger',
                        });
                        reject();
                    });
                });
            },
            getChoices(items) {
                let choices = {};
                for (let item of items) {
                    if (!item['@title']) {
                        throw new Error('No title found for item ' + item['@id']);
                    }
                    choices[item['@id']] = item['@title'];
                }
                return choices;
            },
            async getFormSchema(currentFormSchema, resourceIdentifier = null, userSchema = null, oldUserSchema = null) {
                const resource = resourceIdentifier ? this.getResource(resourceIdentifier) : null;
                let formSchema = [];
                if (!this.resourceIdentifier) {
                    if (!_.isPlainObject(userSchema)) {
                        throw new Error('If no resourceIdentifier is defined, the schema has to be an object describing the fields.');
                    }
                    for (const [name, properties] of Object.entries(userSchema)) {
                        formSchema.push({
                            name,
                            ...properties
                        })
                    }
                    return formSchema;
                }
                const docsFields = resource?.['hydra:supportedProperty'];
                if (_.isEmpty(userSchema)) {
                    for (const docsField of docsFields) {
                        if (!docsField['hydra:writable'] && !this.showNonWritableFields) {
                            continue;
                        }
                        formSchema.push(await this.getSchemaItem(docsField));
                    }
                    return formSchema;
                }
                if (_.isArray(userSchema)) {
                    for (const name of userSchema) {
                        if (oldUserSchema && oldUserSchema.includes(name)) {
                            const oldItem = currentFormSchema.length ? currentFormSchema.find(item => item.name === name) : null;
                            if (oldItem) {
                                formSchema.push(oldItem);
                                continue;
                            }
                        }
                        const docsField = this.getProperty(name, resource);
                        if (docsField) {
                            if (!docsField['hydra:writable'] && !this.showNonWritableFields) {
                                continue;
                            }
                            formSchema.push(await this.getSchemaItem(docsField));
                        } else {
                            throw new Error('Unknown field "' + name + '". Please check the name or declare schema as an object and give it properties.');
                        }
                    }
                    return formSchema;
                }
                for (const [name, overrides] of Object.entries(userSchema)) {
                    const oldItem = oldUserSchema ? oldUserSchema[name] : null;
                    if (_.isEqual(overrides, oldItem)) {
                        const oldItem = currentFormSchema.length ? currentFormSchema.find(item => item.name === name) : null;
                        if (oldItem) {
                            formSchema.push(oldItem);
                            continue;
                        }
                    }
                    const docsField = this.getProperty(name, resource);
                    if (docsField) {
                        if (!docsField['hydra:writable'] && !this.showNonWritableFields) {
                            continue;
                        }
                        formSchema.push(await this.getSchemaItem(docsField, overrides));
                    } else {
                        formSchema.push({
                            name,
                            ...overrides
                        })
                    }
                }
                return formSchema;
            },
            getFormData(apiData) {
                let formData = {};
                for (const [key, value] of Object.entries(apiData)) {
                    if (_.isPlainObject(value) && value['@id']) {
                        formData[key] = value['@id'];
                        continue;
                    }
                    if (_.isArray(value) && value.length && value[0]['@id']) {
                        let items = [];
                        value.forEach(item => {
                            items.push(this.getFormData(item));
                        })
                        formData[key] = items;
                        continue;
                    }
                    formData[key] = value;
                }
                return formData;
            }
        },
        watch: {
            schema(newUserSchema, oldUserSchema) {
                if (_.isEqual(newUserSchema, oldUserSchema)) {
                    return;
                }
                if (typeof newUserSchema !== typeof oldUserSchema) {
                    throw new Error('Please do not change the type of the schema on the fly');
                }
                this.getFormSchema(this.formSchema, this.resourceIdentifier, newUserSchema, oldUserSchema).then(schema => this.formSchema = schema);
            },
            resourceIdentifier(resourceIdentifier) {
                this.getFormSchema(this.formSchema, resourceIdentifier, this.schema).then(schema => this.formSchema = schema);
            },
        },
        created() {
            if (!this.resourceIdentifier) {
                if (!this.title && this.showTitle) {
                    throw new Error('You need to set either a resourceIdentifier or a title');
                }
                if (!this.uri && this.isPostable) {
                    throw new Error('You need to set either a resourceIdentifier or an URI');
                }
            }
            this.$store.dispatch('openApi/loadApiSchema').then(() => {
                if (this.id) {
                    this.$api.authenticated().get(this.resourceUrl + '/' + this.id).then(response => {
                        this.formData = this.getFormData(response.data);
                    }).catch(() => {
                        this.$bvToast.toast('Unable to fetch the existing item.', {
                            title: 'Error',
                            variant: 'danger',
                        });
                    });
                }
                this.getFormSchema(null, this.resourceIdentifier, this.schema).then(schema => this.formSchema = schema);
            });
        },
        destroyed() {
            this.item = null;
        },
    }
</script>

<style scoped>

</style>