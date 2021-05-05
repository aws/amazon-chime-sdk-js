// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
/* eslint-enable */
const app = process.env.npm_config_app || 'video_test';

module.exports = env => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        inlineSource: '.(js|css)$',
        template: __dirname + `/${app}/${app}.html`,
        filename: __dirname + `/dist/${app}.html`,
        inject: 'head',
      })
    ],
    entry: [`./${app}/${app}.ts`],
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
          test: /\.tsx?$/,
          loader: 'ts-loader',
        },
      ],
    },
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    performance: {
      hints: false,
    },
  };
};
