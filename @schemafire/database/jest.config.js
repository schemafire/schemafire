const config = require('../../support/jest/jest.config');

module.exports = {
  ...config,
  name: require('./package.json').name,
  displayName: 'Realtime Database Schema',
};
