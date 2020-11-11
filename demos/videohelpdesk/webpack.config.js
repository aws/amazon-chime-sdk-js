// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
var HtmlWebpackInlineSourcePlugin = require ('html-webpack-inline-source-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
/* eslint-enable */

module.exports = env => {
  const app = env.app;
  return {
    plugins: [
      new HtmlWebpackPlugin({
        inlineSource: '.(js)$',
        template: __dirname + `/src/${app}.html`,
        filename: __dirname + `/dist/${app}.html`,
        inject: 'head',
      }),
      new HtmlWebpackInlineSourcePlugin(),
    ],
    entry: [`./src/${app}.js`],
    resolve: {
      extensions: ['.js'],
    },
    mode: 'development',
    performance: {
      hints: false,
    },
  };
};
