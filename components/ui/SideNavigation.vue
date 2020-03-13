<template>
    <div :class="'side-navigation' + (closed ? ' closed' : '') + (collapsed ? ' collapsed' : '')">
        <header>
            <strong>Navigatie</strong>
        </header>
        <main>
            <b-nav vertical>
                <b-nav-item :key="index" :to="item.to" @click="close" v-for="(item, index) in items">
                    <font-awesome-icon :icon="[iconStyle, item.icon]" v-if="item.icon"></font-awesome-icon>
                    <span>{{item.text}}</span></b-nav-item>
            </b-nav>
        </main>
        <footer>
            <b-nav vertical>
                <b-nav-item @click="collapse" class="nav-item-collapse">
                    <font-awesome-icon :icon="[iconStyle, 'arrow-circle-left']"></font-awesome-icon>
                    <span>Collapse</span></b-nav-item>
            </b-nav>
        </footer>
    </div>
</template>

<script>
    export default {
        name: "SideNavigation",
        props: {
            nav: {
                type: String,
                required: true,
            }
        },
        methods: {
            close() {
                this.closed = true;
            },
            open() {
                this.closed = false;
            },
            collapse() {
                this.collapsed = !this.collapsed;
            }
        },
        computed: {
            iconStyle() {
                return this.$store.state[this.nav].iconStyle ? this.$store.state[this.nav].iconStyle : 'fas';
            },
            items() {
                return this.$store.state[this.nav] ? this.$store.state[this.nav].items : [];
            },
            collapsed: {
                get() {
                    return this.$store.state[this.nav].collapsed;
                },
                set(value) {
                    return this.$store.commit(this.nav + '/setCollapsed', value);
                },
            },
            closed: {
                get() {
                    return this.$store.state[this.nav].closed;
                },
                set(value) {
                    return this.$store.commit(this.nav + '/setClosed', value);
                },
            },
        }


    }
</script>

<style lang="scss" scoped>

</style>