// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Starts the backend API server on port 8081, then launches the Vite dev server on port 8080.
 * Vite proxies API requests to the backend.
 */

const { serve } = require('./api-server.js');
const { createServer } = require('vite');

async function start() {
  // Start the API backend
  serve('127.0.0.1:8081');

  // Start Vite dev server
  const server = await createServer({
    configFile: './vite.config.ts',
  });
  await server.listen();
  server.printUrls();
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
