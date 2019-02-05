const { runChecks } = require('../scripts/pretest');
const { isLiveTest } = require('../utils');
const chalk = require('chalk');

module.exports = async () => {
  if (!isLiveTest()) {
    return;
  }
  console.log('checking tests can be run');
  return runChecks().catch((e: Error) => {
    console.error(chalk`{red.bold Something went wrong when running checks}`, e);
    process.exit(1);
  });
};
