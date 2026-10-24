// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Sent by both vite.config.ts and api-server.js. 'unsafe-inline' in script-src-elem allows the
// built page's single inline module script.
const cspDirectives = {
  'connect-src': "'self' data: https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com",
  'script-src': "'self' 'unsafe-eval' blob: 'wasm-unsafe-eval'",
  'script-src-elem': "'self' 'unsafe-inline' blob:",
  'worker-src': "'self' blob:",
  'child-src': "'self' blob:",
};

// SDK assets in all stages, for testing and canaries.
for (const stage of ['a', 'b', 'g', '']) {
  const host = ` https://*.sdkassets.${stage}chime.aws`;
  const media = ` wss://*.${stage}chime.aws`;
  cspDirectives['connect-src'] += host + media;
  cspDirectives['script-src'] += host;
  cspDirectives['script-src-elem'] += host;
}

// Segmentation filter models.
cspDirectives['connect-src'] += ' https://storage.googleapis.com';

// TensorFlow for background blur.
cspDirectives['connect-src'] += ' https://cdn.jsdelivr.net';
cspDirectives['script-src'] += ' https://cdn.jsdelivr.net';
cspDirectives['script-src-elem'] += ' https://cdn.jsdelivr.net';

// Gamma event ingestion, for testing and canaries.
cspDirectives['connect-src'] += ' https://*.ingest.gchime.aws';

module.exports = Object.entries(cspDirectives)
  .map(([key, value]) => `${key} ${value}`)
  .join('; ');
