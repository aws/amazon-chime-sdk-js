const webpackConfig = require('../webpack.config');
const path = require('path');
const cssRule = webpackConfig.module.rules[0];

module.exports = ({ config }) => {
  config.module.rules = [
    {
      test: /\.css$/,
      use: ['style-loader', ...cssRule.use.slice(1)]
    },
    ...webpackConfig.module.rules.slice(1),
    {
      test: /\.(ts|tsx)$/,
      include: [
        path.resolve(__dirname, '../src'),
        path.resolve(__dirname, '../.storybook')
      ]
    }
  ]
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
}
