// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * See also webpack.config.hot.js, which is a fork of this file.
 * Please make changes in both places if applicable.
 */

/* eslint-disable */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
/* eslint-enable */

/**
 * This is exactly what we document in the CSP guide.
 */
// const csp = {
//   'connect-src': "'self' data: https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com",

//   // 'wasm-unsafe-eval' is to allow Amazon Voice Focus to work in Chrome 95+. 
//   // Strictly speaking, this should be enough, but the worker cannot compile WebAssembly unless
//   // 'unsafe-eval' is also present.
//   'script-src': "'self' 'unsafe-eval' blob: 'wasm-eval' 'wasm-unsafe-eval'",

//   // Script hashes/nonces are not emitted for script-src-elem, so just add unsafe-inline.
//   'script-src-elem': "'self' 'unsafe-inline' blob:",
//   'worker-src': "'self' blob:",
//   'child-src': "'self' blob:",
// };

// // Modify our basic CSP to allow several things:
// // 1. Access to assets in all stages for testing and canaries.
// for (const stage of ['a', 'b', 'g', '']) {
//   const host = ` https://*.sdkassets.${stage}chime.aws`;
//   const media = ` wss://*.${stage}chime.aws`;
//   csp['connect-src'] += host + media;
//   csp['script-src'] += host;
//   csp['script-src-elem'] += host;
// }
// csp['script-src'] += host;

const csp = {
  'default-src': "'self' * data: blob:;",
  'script-src': "'self' * 'unsafe-inline' 'unsafe-eval' data: blob:;",
  'style-src': "'self' * 'unsafe-inline' data: blob:;",
  'img-src': "'self' * data: blob:;",
  'connect-src': "'self' * data: blob:;",
  'font-src': "'self' * data: blob:;",
  'object-src': "'self' * blob:;",
  'media-src': "'self' * data: blob:;",
  'frame-src': "'self' * blob:;",
  'worker-src': "'self' blob:;",
  'child-src': "'self' blob:;"
};


// // 2. Access to googleapis for the Segmentation filter
// csp['connect-src'] += ' https://storage.googleapis.com';

// // 3. Access to jsdelivr for TensorFlow for background blur.
// csp['script-src'] += ' https://cdn.jsdelivr.net';
// csp['script-src-elem'] += ' https://cdn.jsdelivr.net';

// // DREW ADDING LOCALHOST
// csp['connect-src'] += " https://aptiversity.com:5555";
// csp['connect-src'] += " https://aptiversity.com";
// csp['connect-src'] += " https://www.aptiversity.com";
// csp['connect-src'] += " https://aptiversity.com:*";
// csp['connect-src'] += " https://172.31.84.112:5555";
// csp['connect-src'] += " https://10.0.0.94:5555";
// csp['connect-src'] += " http://127.0.0.1:8081/";
// csp['connect-src'] += " http://127.0.0.1:8081";
// csp['connect-src'] += " http://127.0.0.1:8081*";
// csp['connect-src'] += " http://127.0.0.1:8080";
// csp['connect-src'] += " http://127.0.0.1:8081*";
// csp['connect-src'] += " https://10.0.0.94";
// csp['connect-src'] += " https://10.0.0.94:5555";
// csp['connect-src'] += " https://www.ec2-34-235-178-135.compute-1.amazonaws.com:5555";
// csp['connect-src'] += " https://ec2-34-235-178-135.compute-1.amazonaws.com:*";
// csp['connect-src'] += " https://ec2-34-235-178-135.compute-1.amazonaws.com";
// csp['connect-src'] += " https://ec2-34-235-178-135.compute-1.amazonaws.com:5555";
// csp['connect-src'] += " https://larq.ai:5555";
// csp['connect-src'] += " https://larq.com:*";
// csp['connect-src'] += " https://larq.ai";
// csp['connect-src'] += " https://larq.ai:*";
// csp['connect-src'] += " https://larq.ai:8081";
// csp['connect-src'] += " https://larq.ai:8080";


// // 4. Add 'unsafe-eval' because TensorFlow needs it.
// if (!csp['script-src'].includes("'unsafe-eval'")) {
//   csp['script-src'] += " 'unsafe-eval'";
// }

// // 5. Access to event ingestion gamma endpoint for testing and canaries.
// csp['connect-src'] += ' https://*.ingest.gchime.aws ';



module.exports = env => {
  console.info('Env:', JSON.stringify(env, null, 2));
  console.info('App:', process.env.npm_config_app);
  const app = env.app || process.env.npm_config_app || 'meetingV2';
  console.info('Using app', app);
  return {
    devServer: {
      devMiddleware: {
        index: `${app}.html`
      },
  allowedHosts: ['larq.ai'],
  public: 'larq.ai',
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
  },
      onListening: (server) => {
        // Just so that the code in server.js isn't confused about
        // which app finally made it through the gauntlet.
        process.env.npm_config_app = app;
        const { serve } = require('./server.js');
        serve('127.0.0.1:8080');
      },
      static: {
        publicPath: '/',
      },
      port: 8080,
      proxy: {
        '/join': 'http://127.0.0.1:8081',
        '/deleteAttendee': 'http://127.0.0.1:8081',
        '/end': 'http://127.0.0.1:8081',
        '/fetch_credentials': 'http://127.0.0.1:8081',
        '/audio_file': 'http://127.0.0.1:8081',
        '/stereo_audio_file': 'http://127.0.0.1:8081',
        '/update_attendee_capabilities': 'http://127.0.0.1:8081',
        '/batch_update_attendee_capabilities_except': 'http://127.0.0.1:8081',
        '/get_attendee': 'http://127.0.0.1:8081',
      }
    },
    plugins: [
      new CspHtmlWebpackPlugin(csp),
      new HtmlWebpackPlugin({
        inlineSource: '.(js|css)$',
        template: __dirname + `/app/${app}/${app}.html`,
        filename: __dirname + `/dist/${app}.html`,
        inject: 'head',
      }),
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [new RegExp(`${app}`)]),
      new webpack.EnvironmentPlugin({
        IS_LOCAL: process.env.npm_config_is_local === 'true' ? 'true' : 'false'
      })
    ],
    entry: [`./app/${app}/${app}.ts`],
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    },
    output: {
      path: __dirname + '/dist',
      filename: `${app}-bundle.js`,
      publicPath: '/',
      libraryTarget: 'var',
      library: `app_${app}`,
    },
    module: {
      rules: [
        {
          test: /\.(svg)$/,
          type: 'asset/source'
        },
        {
          test: /\.(scss)$/,
          use: [{
            loader: 'style-loader',
            options: {
              insert: 'head',
            },
          }, {
            loader: 'css-loader',
          }, {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  "autoprefixer"
                ]
              }
            },
          }, {
            loader: 'sass-loader',
          }]
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
        },
      ],
    },
    mode: 'production',
    performance: {
      hints: false,
    },
  };
};
