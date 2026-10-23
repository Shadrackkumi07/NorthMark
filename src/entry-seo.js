// Build-time rendering of the same Vue pages visitors use. No network or browser required.
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import * as components from 'quasar';
import quasarLang from 'quasar/lang/en-US.js';
import quasarIconSet from 'quasar/icon-set/material-icons.js';
import App from './App.vue';
import router from './router';

export async function render(url) {
  const app = createSSRApp(App);
  const context = { req: { headers: { 'user-agent': 'Northmark static renderer' } } };
  app.use(components.Quasar, { components, lang: quasarLang, iconSet: quasarIconSet }, context);
  app.use(router);
  await router.push(url);
  await router.isReady();
  const html = await renderToString(app, context);
  return { html, meta: router.currentRoute.value.meta };
}
