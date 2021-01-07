import Vue from 'vue';
import VueFormulate from '@braid/vue-formulate';
import IntegerType from "../components/vue-formulate/IntegerType";
import MultiselectType from "../components/vue-formulate/MultiselectType";
import CheckboxFilterType from "../components/vue-formulate/CheckboxFilterType";
import DateRangeType from "../components/vue-formulate/DateRangeType";

Vue.component('IntegerType', IntegerType);
Vue.component('MultiselectType', MultiselectType);
Vue.component('CheckboxFilterType', CheckboxFilterType);
Vue.component('DateRangeType', DateRangeType);

Vue.use(VueFormulate, {
    library: {
        integer: {
            classification: 'text',
            component: 'IntegerType'
        },
        multiselect: {
            classification: 'select',
            component: 'MultiselectType'
        },
        checkboxfilter: {
            classification: 'checkbox',
            component: 'CheckboxFilterType',
        },
        daterange: {
            classification: 'date',
            component: 'DateRangeType'
        }
    },
    rules: {
        inOptions: (context, ...args) => {
            return args.some(arg => context.value.includes(arg));
        }
    }
});

export default VueFormulate;