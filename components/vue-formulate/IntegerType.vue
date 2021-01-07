<template>
    <div
        :class="`formulate-input-element formulate-input-element--${context.type}`"
        :data-type="context.type"
    >
        <input
                type="number"
                v-model.number="context.model"
                v-bind="context.attributes"
        >
    </div>
</template>

<script>
    export default {
        name: "IntegerType",
        props: {
            context: {
                type: Object,
                required: true
            },
        },
    }
</script>