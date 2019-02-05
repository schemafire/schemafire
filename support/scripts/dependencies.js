const firebaseTools = require('firebase-tools');
const chalk = require('chalk');
const { startCase } = require('lodash');
const Listr = require('listr');
const inquirer = require('inquirer');

const Timeout = Symbol('timeout');

const timeout = (ms = 1000) =>
  new Promise(resolve => {
    setTimeout(() => resolve(Timeout), timeout);
  });

const checkEmulator = ({ only, errorMessage = 'Emulator not found', ms = 1000 }) =>
  Promise.race([firebaseTools.serve({ only }), timeout(ms)]).then(result => {
    if (result === Timeout) {
      return;
    }
    throw new Error(errorMessage);
  });

const installFirestoreEmulator = () => firebaseTools.setup.emulators.firestore();
const checkFirestoreEmulator = () =>
  checkEmulator({ only: 'firestore', ms: 1000, errorMessage: 'Firestore emulator not found' });

const installDatabaseEmulator = () => firebaseTools.setup.emulators.database();
const checkDatabaseEmulator = () =>
  checkEmulator({ only: 'database', ms: 1000, errorMessage: 'Database emulator not found' });

const dependencies = {
  'firestore:emulator': [
    checkFirestoreEmulator,
    installFirestoreEmulator,
    'Would you like to install the firestore emulator, which is required for running tests?',
  ],
  'firebase:emualator': [
    checkDatabaseEmulator,
    installDatabaseEmulator,
    'Would you like to setup the database emulator which is required for running tests?',
  ],
};

const createTaskList = (failed = new Set()) => {
  return Object.entries(dependencies).reduce((current, [name, [check]]) => {
    const task = {
      title: chalk`Checking for dependency: {bold.blue ${startCase(name)}}`,
      task: () =>
        check().catch(e => {
          failed.add(name);
          throw e;
        }),
    };
    return [...current, task];
  }, []);
};

const createResolutionList = (results, failed = new Set()) => {
  return Object.entries(results).reduce((current, [name, resolver]) => {
    const task = {
      title: chalk`Resolving dependency: {bold.blue ${startCase(name)}}`,
      task: () =>
        resolver().catch(e => {
          failed.add(name);
          throw new Error('Something went wrong ' + e.message);
        }),
    };
    return [...current, task];
  }, []);
};

const transformResult = result =>
  Object.entries(result).reduce((current, [name, outcome]) => {
    return outcome ? { ...current, [name]: dependencies[name][1] } : current;
  }, {});

const checkDependencies = (exports.checkDependencies = async () => {
  const failedChecks = new Set();
  const list = createTaskList(failedChecks);
  const tasks = new Listr(list);
  try {
    await tasks.run();
    console.log(chalk`{green 'Great! You're ready to get started 😋}`);
    return;
  } catch (e) {
    console.log(chalk`{yellow 'Some of the dependencies need to be resolved'}`);
  }

  if (failedChecks.size <= 0) return;

  const values = Array.from(failedChecks.values()).map(name => ({
    type: 'confirm',
    message: dependencies[name][2],
    name,
  }));

  const result = await inquirer.prompt(values);
  const actions = transformResult(result);

  const failedResolutions = new Set();
  const resolutionTasks = new Listr(createResolutionList(actions, failedResolutions));
  try {
    await resolutionTasks.run();
    console.log(chalk`{green 'Great! You're ready to get started 😋 }`);
  } catch (e) {
    console.error(e);
    throw e;
  }
});

if (!module.parent) {
  checkDependencies().catch(e => process.exit(1));
}
