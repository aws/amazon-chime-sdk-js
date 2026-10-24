// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// The Content-Security-Policy both demo servers send with the page: the Vite dev server
// (vite.config.ts) and api-server.js, which serves the built single-file page. The built page
// inlines the app in one <script type="module">, which 'unsafe-inline' in script-src-elem allows.
// There is no style-src or default-src, so inline styles are not restricted.

/**
 * This is exactly what we document in the CSP guide.
 */
const cspDirectives = {
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

module.exports = Object.entries(cspDirectives)
  .map(([key, value]) => `${key} ${value}`)
  .join('; ');
