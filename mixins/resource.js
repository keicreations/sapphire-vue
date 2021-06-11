export default {
    props: {
        id: {
            type: String,
        }
    },
    computed: {
        item() {
            return this.$store.state.form.item;
        }
    }
};