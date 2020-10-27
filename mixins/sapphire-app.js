export default {
    created() {
        this.$store.dispatch('user/loadToken').catch(() => {
            this.redirectToLogin();
        });
        this.$store.dispatch('user/loadRefreshToken');
        this.$store.dispatch('mercure/loadToken');
    },
    watch: {
        '$route' () {
            if (!this.loggedIn) {
                this.redirectToLogin();
            }
        },
        loggedIn(isLoggedIn) {
            if (!isLoggedIn) {
                this.redirectToLogin();
            }
        },
        toasts(toasts) {
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                this.$root.$bvToast.toast(toast.message, toast);
                this.$store.commit('toasts/removeToast', i);
            }
        }
    },
    methods: {
        redirectToLogin() {
            const currentRoute = this.$router.currentRoute;
            if (currentRoute.path !== '/login' && !currentRoute.meta.anonymous) {
                this.$router.replace('/login');
            }
        }
    },
    computed: {
        loggedIn() {
            return this.$store.state.user.user !== null;
        },
        toasts() {
            return this.$store.state.toasts.toasts;
        }
    }
};