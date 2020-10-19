export default {
    created() {
        this.$store.dispatch('user/loadToken').catch(() => {
            this.redirectToLogin();
        });
        this.$store.dispatch('user/loadRefreshToken');
        this.$store.dispatch('mercure/loadToken');
    },
    watch: {
        loggedIn(isLoggedIn) {
            if (!isLoggedIn) {
                this.redirectToLogin();
            }
        }
    },
    methods: {
        redirectToLogin() {
            if (this.$router.currentRoute.path !== '/login') {
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