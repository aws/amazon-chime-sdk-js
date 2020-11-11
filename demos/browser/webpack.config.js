// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
var webpack = require('webpack');
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
/* eslint-enable */

const app = process.env.npm_config_app || 'meetingV2';

module.exports = env => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        inlineSource: '.(js|css)$',
        template: __dirname + `/app/${app}/${app}.html`,
        filename: __dirname + `/dist/${app}.html`,
        inject: 'head',
      }),
      new HtmlWebpackInlineSourcePlugin(),
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
          loader: 'raw-loader',
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
              plugins: function () {
                return [
                  require('precss'),
                  require('autoprefixer')
                ];
              },
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
