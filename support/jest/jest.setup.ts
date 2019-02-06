import chalk from 'chalk';
import { TestEmulator } from './test-emulator';

const { runChecks } = require('../scripts/pretest');
const { isLiveTest } = require('../utils');

module.exports = async () => {
  if (!isLiveTest()) {
    return;
  }

  // Starting the emulator
  await TestEmulator.start('firestore');

  // Checking that tests can be run
  return runChecks().catch((e: Error) => {
    console.error(chalk`{red.bold Something went wrong when running checks}`, e);
    process.exit(1);
  });
};
