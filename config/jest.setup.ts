const { runChecks } = require('./scripts/pretest');
const { isLiveTest } = require('./utils');

module.exports = async () => {
  if (!isLiveTest()) {
    return;
  }
  console.log('Running checks');
  return runChecks();
};
