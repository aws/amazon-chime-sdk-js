// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This file is a fork of webpack.config.js. 
 * My apologies. Please make changes in both places if applicable.
 * 
 * It's a fork because they need separate dev/source-map properties so that we can test CSP.
 * 
 * TODO: use tooling to share a base config.
 */

/* eslint-disable */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
/* eslint-enable */

module.exports = env => {
  console.info('Env:', JSON.stringify(env, null, 2));
  console.info('App:', process.env.npm_config_app);
  const app = env.app || process.env.npm_config_app || 'meetingV2';
  console.info('Using app', app);
  return {
    devServer: {
      hot: true,
      devMiddleware: {
        index: `${app}.html`
      },
      onListening: (server) => {
        // Just so that the code in server.js isn't confused about
        // which app finally made it through the gauntlet.
        process.env.npm_config_app = app;
        const { serve } = require('./server.js');
        serve('127.0.0.1:8081');
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
      }
    },
    plugins: [
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
    mode: 'development',
    performance: {
      hints: false,
    },
  };
};
