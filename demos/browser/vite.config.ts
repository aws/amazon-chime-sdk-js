// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { watch } from 'chokidar';
import { resolve } from 'path';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// CommonJS so that api-server.js, which serves the built page, sends the same policy.
const cspString: string = require('./csp.js');

const app = process.env.APP || 'meetingV2';
const watchSdk = process.env.SDK_AUTOREFRESH === 'true';
const sdkBuildDir = resolve(__dirname, '../../build');

const apiProxy = {
  target: 'http://127.0.0.1:8081',
  changeOrigin: true,
};

/**
 * Rewrites `/` and `/?query` to the app's HTML entry so the dev server doesn't 404.
 */
function rewriteRootPlugin(): Plugin {
  return {
    name: 'rewrite-root',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '';
        const pathname = url.split('?')[0];
        if (pathname === '/' || pathname === '') {
          req.url = `/${app}.html` + (url.includes('?') ? url.substring(url.indexOf('?')) : '');
        }
        next();
      });
    },
  };
}

/**
 * Full-reload on any source change since the app doesn't use HMR accept boundaries.
 * When SDK_AUTOREFRESH=true, also reloads when the SDK build output changes (`npm run tsc:watch`).
 */
function fullReloadPlugin(): Plugin {
  return {
    name: 'full-reload',
    handleHotUpdate() {
      return [];
    },
    configureServer(server) {
      if (watchSdk) {
        const sdkWatcher = watch(sdkBuildDir, { ignoreInitial: true, depth: 2 });
        let debounce: ReturnType<typeof setTimeout> | null = null;
        sdkWatcher.on('change', () => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(() => {
            console.log('[full-reload] SDK build changed, reloading browser...');
            server.ws.send({ type: 'full-reload' });
          }, 1000);
        });
        console.log('[full-reload] Watching SDK build output for changes (SDK_AUTOREFRESH).');
      }

      server.watcher.on('change', () => {
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  plugins: [rewriteRootPlugin(), fullReloadPlugin(), viteSingleFile()],
  root: resolve(__dirname, `app/${app}`),
  publicDir: resolve(__dirname, 'public'),
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  optimizeDeps: {
    include: ['amazon-chime-sdk-js'],
    force: true,
  },
  define: {
    global: 'globalThis',
    'process.env.IS_LOCAL': JSON.stringify(
      process.env.npm_config_is_local === 'true' ? 'true' : 'false'
    ),
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        passes: 2,
      },
    },
    commonjsOptions: {
      // The SDK by path, so a checkout under any directory name bundles it.
      include: [`${sdkBuildDir}/**`, `${resolve(__dirname, '../../libs')}/**`, /node_modules/],
    },
    rollupOptions: {
      input: resolve(__dirname, `app/${app}/${app}.html`),
      onwarn(warning, defaultHandler) {
        if (warning.code === 'EVAL' && warning.id?.includes('@protobufjs')) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8080,
    headers: {
      'Content-Security-Policy': cspString,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/join': apiProxy,
      // Anchored: a plain '/meeting' prefix would also catch the app page /meetingV2.html.
      '^/meeting(\\?|$)': apiProxy,
      '/end': apiProxy,
      '/fetch_credentials': apiProxy,
      '/audio_file': apiProxy,
      '/stereo_audio_file': apiProxy,
      '/update_attendee_capabilities': apiProxy,
      '/batch_update_attendee_capabilities_except': apiProxy,
      '/get_attendee': apiProxy,
      '/startCapture': apiProxy,
      '/endCapture': apiProxy,
      '/startLiveConnector': apiProxy,
      '/endLiveConnector': apiProxy,
      '/start_transcription': apiProxy,
      '/stop_transcription': apiProxy,
    },
  },
});
