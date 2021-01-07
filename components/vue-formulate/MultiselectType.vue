<template>
    <div
        :class="`formulate-input-element formulate-input-element--${context.type}`"
        :data-type="context.type"
    >
        <Multiselect
            v-model="context.model"
            :multiple="true"
            :options="context.options.map(option => option.value)"
            :custom-label="option => context.options.find(item => item.value === option).label"
            :close-on-select="false"
        />
    </div>
</template>

<script>
export default {
    name: "MultiselectType",
    props: {
        context: {
            type: Object,
            required: true,
        }
    },
}
</script>

<style scoped>

</style>