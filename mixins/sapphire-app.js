export default {
    created() {
        this.$store.dispatch('user/loadToken').then(() => {
            this.handleAccessControl(true);
        }).catch(() => {
            this.handleAccessControl(false);
        });
        this.$store.dispatch('user/loadRefreshToken');
        this.$store.dispatch('mercure/loadToken');
    },
    watch: {
        '$route' () {
            this.handleAccessControl(this.loggedIn);
        },
        loggedIn(isLoggedIn) {
            this.handleAccessControl(this.loggedIn);
        },
        toasts(toasts) {
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.read) {
                    continue;
                }
                this.$root.$bvToast.toast(toast.message, toast);
                this.$store.dispatch('toasts/markToastRead', i);
            }
        }
    },
    methods: {
        handleAccessControl(isLoggedIn) {
            const currentRoute = this.$router.currentRoute;
            let accessControl = currentRoute.meta.accessControl;
            if (!accessControl) {
                throw new Error(`No access control defined for route ${currentRoute.path}.`)
            }
            if (!accessControl.anonymous && !accessControl.authenticated) {
                throw new Error('Access control cannot be disabled for both anonymous and authenticated.');
            }
            if (accessControl.anonymous && !accessControl.authenticated && isLoggedIn) {
                if (accessControl.redirectTo) {
                    this.replaceRoute(accessControl.redirectTo);
                } else {
                    this.replaceRoute('/');
                }
            } else if (accessControl.authenticated && !accessControl.anonymous && !isLoggedIn) {
                if (accessControl.redirectTo) {
                    this.replaceRoute(accessControl.redirectTo);
                } else {
                    this.replaceRoute('/login');
                }
            }
        },
        replaceRoute(route) {
            if (this.$router.currentRoute.path !== route) {
                this.$router.replace(route);
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