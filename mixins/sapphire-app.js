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
        }
    }
};