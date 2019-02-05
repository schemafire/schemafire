import chalk from 'chalk';
import { TestEmulator } from './test-emulator';

const { runChecks } = require('../scripts/pretest');
const { isLiveTest } = require('../utils');

module.exports = async () => {
  global.TestEmulator = TestEmulator;

  await TestEmulator.startFirestore();

  if (!isLiveTest()) {
    return;
  }
  console.log('checking tests can be run');
  return runChecks().catch((e: Error) => {
    console.error(chalk`{red.bold Something went wrong when running checks}`, e);
    process.exit(1);
  });
};
