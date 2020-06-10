const baseBabel = require('./support/babel/base.babel');

module.exports = {
  ...baseBabel,
  babelrcRoots: ['.', '@schemafire/*', 'docs/.babelrc.js'],
  sourceType: 'unambiguous',
};
