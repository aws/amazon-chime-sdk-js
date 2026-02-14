// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Vite plugin that replaces EJS-style `<%= require('...svg') %>` with inline SVG content.
 * This bridges the EJS-style asset inclusion pattern to Vite.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Plugin } from 'vite';

export default function ejsSvgPlugin(): Plugin {
  return {
    name: 'vite-plugin-ejs-svg',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string, ctx) {
        const htmlDir = dirname(ctx.filename);
        return html.replace(
          /<%=\s*require\(\s*['"]([^'"]+\.svg)['"]\s*\)\s*%>/g,
          (_match, requirePath) => {
            const svgPath = resolve(htmlDir, requirePath);
            try {
              return readFileSync(svgPath, 'utf-8');
            } catch {
              console.warn(`[ejs-svg] Could not read SVG: ${svgPath}`);
              return '';
            }
          }
        );
      },
    },
  };
}
