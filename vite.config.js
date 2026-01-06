import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://calendly.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://calendly.com ws: wss: http://localhost:5173 http://localhost:5000",
  "frame-src 'self' https://calendly.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = {
  'Content-Security-Policy': csp,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue({
        template: { transformAssetUrls }
      }),
      quasar({
        sassVariables: 'src/assets/styles/quasar-variables.sass'
      })
    ],
    server: {
      headers: securityHeaders
    },
    preview: {
      headers: securityHeaders
    },
    resolve: {
      alias: {
        src: resolve(process.cwd(), 'src')
      }
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'quasar']
          }
        }
      }
    }
  };
});
