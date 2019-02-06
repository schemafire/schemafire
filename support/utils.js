const { resolve, join } = require('path');
const { homedir } = require('os');

exports.removePlugin = (name, plugins) =>
  plugins.filter(
    plugin => !(Array.isArray(plugin) ? plugin.includes(name) : plugin === name),
  );

const baseDir = (exports.baseDir = (...args) => resolve(__dirname, '..', ...args));
exports.supportDir = (...args) => baseDir(join('support', ...args));
exports.userFirebaseConfig = () =>
  resolve(homedir(), '.config/configstore/firebase-tools.json');

exports.isLiveTest = () => Boolean(process.env.TEST_ENV);

exports.createDBPrefix = () => {
  const generate = require('nanoid/generate');
  return `test/${generate('abcdefghijklmnopqrstuvwxyz', 10)}`;
};
