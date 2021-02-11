<template>
    <div
        :class="`formulate-input-element formulate-input-element--${context.type}`"
        :data-type="context.type"
    >
        <b-checkbox
            type="checkbox"
            v-model="yesSelected"
        >Yes</b-checkbox>
        <b-checkbox
            type="checkbox"
            v-model="noSelected"
        >No</b-checkbox>
    </div>
</template>

<script>
export default {
    name: "CheckboxFilterType",
    data() {
        return {
            noSelected: false,
            yesSelected: false,
        }
    },
    props: {
        context: {
            type: Object,
            required: true
        },
    },
    watch: {
        noSelected() {
            this.handleInput();
        },
        yesSelected() {
            this.handleInput();
        }
    },
    methods: {
        handleInput() {
            if ((this.yesSelected && this.noSelected) || (!this.yesSelected && !this.noSelected)) {
                this.context.model = '';
                return;
            }
            this.context.model = this.yesSelected;
        }
    }
}
</script>