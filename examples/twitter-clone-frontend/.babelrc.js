const defaultConfig = require('../../support/babel/base.babel');

module.exports = {
  ...defaultConfig,
  presets: ['next/babel', ...defaultConfig.presets, '@emotion/babel-preset-css-prop'],
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
