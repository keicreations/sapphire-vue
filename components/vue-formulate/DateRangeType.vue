<template>
    <div
        :class="`text-center formulate-input-element formulate-input-element--${context.type}`"
        :data-type="context.type"
    >
        <span class="d-flex">
            <b-datepicker v-model="model.after" />
            <font-awesome-icon :icon="['far', 'times']" class="align-self-center ml-2 date-remove-btn" @click="model.after = null" />
        </span>
        <font-awesome-icon :icon="['fas', 'arrow-down']" />
        <span class="d-flex">
            <b-datepicker v-model="model.before" />
            <font-awesome-icon :icon="['far', 'times']" class="align-self-center ml-2 date-remove-btn" @click="model.before = null" />
        </span>
    </div>
</template>

<script>
export default {
    name: "DateRangeType",
    data() {
        return {
            model: {
                before: null,
                after: null,
            }
        }
    },
    props: {
        context: {
            type: Object,
            required: true,
        }
    },
    watch: {
        model: {
            handler(model) {
                this.context.model = model;
            },
            deep: true,
        }
    },
}
</script>

<style scoped>

</style>