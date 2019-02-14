const defaultConfig = require('../../support/babel/base.babel');

module.exports = {
  ...defaultConfig,
  presets: ['@emotion/babel-preset-css-prop', 'next/babel', ...defaultConfig.presets],
  plugins: [
    ...defaultConfig.plugins,
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
