const firebaseTools = require('firebase-tools');
const chalk = require('chalk');
const { startCase } = require('lodash');
const Listr = require('listr');
const inquirer = require('inquirer');

const installFirestoreEmulator = () => firebaseTools.setup.emulators.firestore();
const checkFirestoreEmulator = () => firebaseTools.serve({ only: 'firestore' });

const dependencies = {
  'firestore:emulator': [
    checkFirestoreEmulator,
    installFirestoreEmulator,
    'In order to setup tests you will need to install the firestore emulator',
  ],
};

const failed = new Set();

const createTaskList = () => {
  return Object.entries(dependencies).reduce((current, [name, [check]]) => {
    const task = {
      title: chalk`Checking for dependency: {bold.blue ${startCase(name)}}`,
      task: () =>
        check().catch(e => {
          failed.add(name);
          throw new Error('Emulator not found');
        }),
    };
    return [...current, task];
  }, []);
};

const createResolutionList = results => {
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

const run = async () => {
  const list = createTaskList();
  const tasks = new Listr(list);
  try {
    await tasks.run();
    console.log(chalk`{green 'Great! You're ready to get started 😋}`);
    return;
  } catch (e) {
    console.log(chalk`{yellow 'Some of the dependencies need to be resolved'}`);
  }

  if (failed.size <= 0) return;

  const values = Array.from(failed.values()).map(name => ({
    type: 'confirm',
    message: dependencies[name][2],
    name,
  }));

  const result = await inquirer.prompt(values);
  const actions = transformResult(result);
  const resolutionTasks = new Listr(createResolutionList(actions));
  try {
    await resolutionTasks.run();
    console.log(chalk`{green 'Great! You're ready to get started 😋}`);
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

// (async () => {
run();
// })();
