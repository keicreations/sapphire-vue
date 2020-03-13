<template>
    <div class="resource-item">
        <div v-if="item === null">
            <loading></loading>
        </div>
        <slot :item="item" name="item"></slot>
    </div>
</template>

<script>
    import api from "../../api/util";
    import Loading from "../ui/Loading";

    export default {
        name: "ResourceItem",
        components: {Loading},
        props: {
            uri: {
                type: String,
                required: true,
            },
            resource: {
                type: String,
                required: true,
            },
        },
        computed: {
            item: {
                get() {
                    return this.$store.state.form.item;
                },
                set(item) {
                    return this.$store.commit('form/setItem', item);
                }

            },
        },
        created() {
            api.authenticated().get(this.uri).then(response => {
                this.item = response.data;
            })
        },
        destroyed() {
            this.item = null;
        }
    }
</script>

<style scoped>

</style>
