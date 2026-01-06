import { createApp } from 'vue';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import quasarLang from 'quasar/lang/en-US';
import quasarIconSet from 'quasar/icon-set/material-icons';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import './assets/styles/base.css';

import App from './App.vue';
import router from './router';
import { enforceHttps } from './utils/security';

const app = createApp(App);

enforceHttps();

app.use(Quasar, {
  plugins: { Notify, Dialog, Loading },
  lang: quasarLang,
  iconSet: quasarIconSet,
  config: {
    brand: {
      primary: '#1565C0',
      secondary: '#455A64',
      accent: '#00897B',
      positive: '#43A047',
      negative: '#E53935',
      info: '#039BE5',
      warning: '#FB8C00'
    }
  }
});

app.use(router);
app.mount('#app');
