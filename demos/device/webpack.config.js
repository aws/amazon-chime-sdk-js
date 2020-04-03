// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
const path = require('path');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
/* eslint-enable */

const app = 'device';

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      inlineSource: '.(js|css)$',
      template: __dirname + `/app/${app}.html`,
      filename: __dirname + `/dist/${app}.html`,
      inject: 'head',
    }),
    new HtmlWebpackInlineSourcePlugin(),
  ],
  entry: [`./src/index.tsx`],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: `${app}-bundle.js`,
    publicPath: '/',
    libraryTarget: 'var',
    library: `app_${app}`,
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  node: {
    fs: 'empty',
    tls: 'empty'
  },
  module: {
    rules: [
      {
        test: /\.(tsx|jsx|ts)?$/,
        exclude: /node_modules/,
        loader: 'awesome-typescript-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'source-map-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(svg)$/,
        loader: 'raw-loader',
      },
    ],
  },
  devServer: {
    historyApiFallback: true,
    proxy: {
      '/': {
        target: 'http://localhost:8080',
        bypass: function(req, _res, _proxyOptions) {
          if (req.headers.accept.indexOf('html') !== -1) {
            console.log('Skipping proxy for browser request.');
            return `/${app}.html`;
          }
        },
      },
    },
    contentBase: path.join(__dirname, 'dist'),
    index: `${app}.html`,
    compress: true,
    hot: true,
    host: '0.0.0.0',
    disableHostCheck: true,
    port: 3000,
    https: true,
  },
  performance: {
    hints: false,
  },
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
};
