const defaultConfig = require('../../support/babel/base.babel');

module.exports = {
  ...defaultConfig,
  presets: ['next/babel', '@babel/preset-typescript'],
  plugins: [
    'lodash',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    [
      'module-resolver',
      {
        alias: {
          '@components': './components',
          '@containers': './containers',
          '@firebase': './firebase',
          '@routes': './routes',
          '@server': './server',
          '@typings': './typings',
          '@utils': './utils',
        },
        cwd: 'babelrc',
      },
    ],
  ],
};
