const config = require('../../config/jest.config');

module.exports = {
  ...config,
  name: require('./package.json').name,
  displayName: 'RealtimeDB Schema',
};
