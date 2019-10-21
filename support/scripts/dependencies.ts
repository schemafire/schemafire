import chalk from 'chalk';
import delay from 'delay';
import execa from 'execa';
import firebaseTools from 'firebase-tools';
import inquirer from 'inquirer';
import Listr, { ListrTask } from 'listr';
import { startCase } from 'lodash';
import { readdir } from 'mz/fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import psTree from 'ps-tree';
import { argv } from 'yargs';

const EMULATOR_HOME = resolve(homedir(), '.cache/firebase/emulators');

/**
 * Determine whether prompts should be show when installing dependencies
 */
export const disablePrompt = () => Boolean(process.env.CI || argv.y);

export type EmulatorType = 'database' | 'firestore';

const emulatorNames = {
  firestore: 'cloud-firestore-emulator',
  database: 'firebase-database-emulator',
};

export const findEmulatorPath = async (type: EmulatorType) => {
  const files = await readdir(EMULATOR_HOME);
  const fileName = files.find(file => file.includes(emulatorNames[type]));
  return fileName ? join(EMULATOR_HOME, fileName) : undefined;
};

export const emulatorExists = async (type: EmulatorType) => {
  const location = await findEmulatorPath(type);
  return Boolean(location);
};

/**
 * Promisified version of psTree which allows for killing all the children of a running process, for cleaner exits.
 */
const psTreePromise = (pid: number) =>
  new Promise<ReadonlyArray<psTree.PS>>((res, rej) => {
    psTree(pid, (err, children) => {
      if (err) {
        rej(err);
      } else {
        res(children);
      }
    });
  });

/**
 * Starts an emulator
 * @param type the emulator type
 */
export const startEmulator = (path: string, type: EmulatorType) =>
  execa('java', ['-jar', path, '--host', '127.0.0.1', '--port', EMULATOR_PORTS[type]], {
    stdio: 'ignore',
  });

export const EMULATOR_PORTS: Record<EmulatorType, string> = {
  database: '9000',
  firestore: '8080',
};

/**
 * Makes sure that all children of a process are properly removed.
 */
const killProcessChildren = (child: psTree.PS) => {
  try {
    process.kill(parseInt(child.PID, 10), 'SIGINT');
  } catch (e) {
    if (e.code === 'ESRCH') {
      throw new Error(chalk`{red Child process ${child.PID} exited before trying to stop it }`);
    } else {
      throw e;
    }
  }
};

/**
 * Cleans up the running emulator process.
 */
export const killEmulator = async (emulator: execa.ExecaChildProcess) => {
  const children = await psTreePromise(emulator.pid);
  children.forEach(killProcessChildren);
  emulator.kill();
};

const installFirestoreEmulator = () => firebaseTools.setup.emulators.firestore();
const checkFirestoreEmulator = () => emulatorExists('firestore');

const installDatabaseEmulator = () => firebaseTools.setup.emulators.database();
const checkDatabaseEmulator = () => emulatorExists('database');

interface Dep {
  check: () => Promise<any>;
  resolve: () => Promise<void>;
  question: string;
  skipped: string;
}

const dependencies: Record<string, Dep> = {
  'firestore:emulator': {
    check: checkFirestoreEmulator,
    resolve: installFirestoreEmulator,
    question: 'Set up the firestore emulator?',
    skipped: chalk`Please install the firestore emulator:\n\t{white.italic firebase setup:emulator:firestore }\n`,
  },
  'database:emulator': {
    check: checkDatabaseEmulator,
    resolve: installDatabaseEmulator,
    question: 'Set up the database emulator?',
    skipped: chalk`Please install the database emulator:\n\t{white.italic firebase setup:emulator:database }\n`,
  },
};

const createTaskList = (failed = new Set<string>()) => {
  const initialTasks: ListrTask[] = [];
  return Object.entries(dependencies).reduce((current, [name, { check }]) => {
    const title = chalk`Checking for dependency: {bold.blue ${startCase(name)}}`;
    const task = () =>
      delay(disablePrompt() ? 0 : 1000) // Some aesthetic delay
        .then(() => check())
        .then(() => 'Success')
        .catch(e => {
          failed.add(name);
          throw e;
        });

    return [...current, { title, task }];
  }, initialTasks);
};

/**
 * Creates the tasks to run to resolve any issue that have occurred.
 * @param results
 * @param failed
 */
const createResolverList = (results: Record<string, () => Promise<void>>, failed = new Set<string>()) => {
  const initialTasks: ListrTask[] = [];
  return Object.entries(results).reduce((current, [name, resolver]) => {
    const task = () =>
      resolver().catch(e => {
        failed.add(name);
        throw new Error('Something went wrong ' + e.message);
      });
    const title = chalk`Resolving dependency: {bold.blue ${startCase(name)}}`;

    return [...current, { task, title }];
  }, initialTasks);
};

const transformResult = (result: Record<string, boolean>) => {
  const initialActions: Record<string, () => Promise<void>> = {};
  return Object.entries(result).reduce((current, [name, outcome]) => {
    return outcome ? { ...current, [name]: dependencies[name].resolve } : current;
  }, initialActions);
};

interface FailedChecks {
  type: string;
  message: string;
  name: any;
}

/**
 * Used when the prompt has been disabled to auto select to run all actions.
 * This is mainly used in a CI environment.
 */
const generateResult = (failedChecks: FailedChecks[]) => {
  const initialResult: Record<string, boolean> = {};
  return failedChecks.reduce((p, c) => ({ ...p, [c.name]: true }), initialResult);
};

export const checkDependencies = async () => {
  const failedChecks = new Set<string>();
  const list = createTaskList(failedChecks);
  const tasks = new Listr(list, { exitOnError: false, concurrent: false });

  try {
    await tasks.run();
    console.log(chalk`\n{green Great! You're ready to get started 😋 }\n`);
    return;
  } catch {
    console.log(chalk`\n{yellow Some dependencies are missing }\n`);
  }

  if (failedChecks.size === 0) {
    return;
  }

  const values = Array.from(failedChecks.values()).map(name => ({
    type: 'confirm',
    message: dependencies[name].question,
    name,
  }));

  const result: Record<string, boolean> = disablePrompt()
    ? generateResult(values)
    : await inquirer.prompt<Record<string, boolean>>(values);

  const actions = transformResult(result);
  const skipped = Object.entries(result)
    .filter(([, val]) => !val)
    .reduce<Array<{ key: string; message: string }>>(
      (prev, [key]) => [...prev, { key, message: dependencies[key].skipped }],
      [],
    );

  const failedResolvers = new Set<string>();
  const resolutionTasks = new Listr(createResolverList(actions, failedResolvers));
  try {
    await resolutionTasks.run();
    if (skipped.length) {
      skipped.forEach(({ message }) => {
        console.log(chalk`{yellow ${message} }`);
      });
    } else {
      console.log(chalk`\n{green Great! You're ready to get started 😋 }\n`);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

if (!module.parent) {
  checkDependencies().catch(e => {
    console.log(e);
    process.exit(1);
  });
}
