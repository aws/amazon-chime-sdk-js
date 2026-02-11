// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { watch } from 'chokidar';
import { viteSingleFile } from 'vite-plugin-singlefile';
import ejsSvgPlugin from './plugins/vite-plugin-ejs-svg';

const app = process.env.npm_config_app || process.env.APP || 'meetingV2';
const watchSdk = process.env.SDK_AUTOREFRESH === 'true';

/**
 * This is exactly what we document in the CSP guide.
 */
const cspDirectives: Record<string, string> = {
  'connect-src': "'self' data: https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com",
  'script-src': "'self' 'unsafe-eval' blob: 'wasm-unsafe-eval'",
  'script-src-elem': "'self' 'unsafe-inline' blob:",
  'worker-src': "'self' blob:",
  'child-src': "'self' blob:",
};

// Access to assets in all stages for testing and canaries.
for (const stage of ['a', 'b', 'g', '']) {
  const host = ` https://*.sdkassets.${stage}chime.aws`;
  const media = ` wss://*.${stage}chime.aws`;
  cspDirectives['connect-src'] += host + media;
  cspDirectives['script-src'] += host;
  cspDirectives['script-src-elem'] += host;
}

// Access to googleapis for the Segmentation filter.
cspDirectives['connect-src'] += ' https://storage.googleapis.com';

// Access to jsdelivr for TensorFlow for background blur.
cspDirectives['connect-src'] += ' https://cdn.jsdelivr.net';
cspDirectives['script-src'] += ' https://cdn.jsdelivr.net';
cspDirectives['script-src-elem'] += ' https://cdn.jsdelivr.net';

// Access to event ingestion gamma endpoint for testing and canaries.
cspDirectives['connect-src'] += ' https://*.ingest.gchime.aws';

const cspString = Object.entries(cspDirectives)
  .map(([key, value]) => `${key} ${value}`)
  .join('; ');

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
 * When WATCH_SDK=true, also watches the SDK build output and restarts the server
 * (clearing the dep cache) so that `npm run tsc:watch` changes are picked up.
 */
function fullReloadPlugin(): Plugin {
  return {
    name: 'full-reload',
    handleHotUpdate() {
      return [];
    },
    configureServer(server) {
      if (watchSdk) {
        const sdkBuildDir = resolve(__dirname, '../../build');
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
  plugins: [
    ejsSvgPlugin(),
    rewriteRootPlugin(),
    fullReloadPlugin(),
    viteSingleFile(),
  ],
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
    'process.env.IS_LOCAL': JSON.stringify(process.env.npm_config_is_local === 'true' ? 'true' : 'false'),
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'] as never,
        loadPaths: [resolve(__dirname)],
      },
    },
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
      include: [/amazon-chime-sdk-js/, /node_modules/],
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
      '/deleteAttendee': apiProxy,
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
