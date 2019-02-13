const defaultConfig = require('../../support/babel/base.babel');

module.exports = {
  ...defaultConfig,
  presets: ['next/babel', ...defaultConfig.presets, '@emotion/babel-preset-css-prop'],
  plugins: [...defaultConfig.plugins],
};
