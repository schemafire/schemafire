import chalk from 'chalk';
// import dbg from 'debug';
import execa from 'execa';
import firebaseTools from 'firebase-tools';
import inquirer from 'inquirer';
import Listr, { ListrTask } from 'listr';
import { startCase } from 'lodash';
import psTree from 'ps-tree';

const Timeout = Symbol('timeout');

const timeout = (ms = 1500) =>
  new Promise<symbol>(resolve => {
    setTimeout(() => {
      resolve(Timeout);
    }, ms);
  });

interface CheckEmulatorOptions {
  type: EmulatorType;
  errorMessage?: string;
  ms?: number;
  /**
   * Whether this should only be killed when we an error occurs i.e. (false)
   * Or we want to kill the server whether or not the error occurs (true) - useful for checks.
   */
  alwaysKill?: boolean;
  /**
   * Optionally pass in the emulator to use.
   */
  emulator?: execa.ExecaChildProcess;
}

export type EmulatorType = 'database' | 'firestore';

/**
 * Promisified version of psTree which allows for killing all the children of a running process, for cleaner exits.
 */
const psTreePromise = (pid: number) =>
  new Promise<ReadonlyArray<psTree.PS>>((resolve, reject) => {
    psTree(pid, (err, children) => {
      if (err) {
        reject(err);
      } else {
        resolve(children);
      }
    });
  });

export const startEmulator = (type: EmulatorType) =>
  execa('firebase', ['serve', '--only', type], { stdio: 'ignore' });

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

export const checkEmulatorInstalled = async ({
  type,
  errorMessage = `${startCase(type)} emulator not found`,
  ms = 2000,
  alwaysKill = true,
  emulator = startEmulator(type),
}: CheckEmulatorOptions) => {
  let killed = false;

  const kill = async () => {
    if (!killed) {
      await killEmulator(emulator);
      killed = true;
    }
  };

  try {
    const result = await Promise.race<symbol | execa.ExecaReturns>([emulator, timeout(ms)]);

    // ? This is probably always because of timeout. The emulator either throws or never stops. Refactor soon.
    if (result === Timeout) {
      return;
    }
  } catch {
    await kill();
    throw new Error(errorMessage);
  } finally {
    if (alwaysKill) {
      await kill();
    }
  }
};

const installFirestoreEmulator = () => firebaseTools.setup.emulators.firestore();
const checkFirestoreEmulator = () => checkEmulatorInstalled({ type: 'firestore' });

const installDatabaseEmulator = () => firebaseTools.setup.emulators.database();
const checkDatabaseEmulator = () => checkEmulatorInstalled({ type: 'database' });

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

const createTaskList = (failed = new Set()) => {
  const initialTasks: ListrTask[] = [];
  return Object.entries(dependencies).reduce((current, [name, { check }]) => {
    const title = chalk`Checking for dependency: {bold.blue ${startCase(name)}}`;
    const task = () =>
      check()
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
const createResolverList = (
  results: Record<string, () => Promise<void>>,
  failed = new Set<string>(),
) => {
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

const transformResult = (result: Record<string, boolean>) =>
  Object.entries(result).reduce((current, [name, outcome]) => {
    return outcome ? { ...current, [name]: dependencies[name].resolve } : current;
  }, {});

export const checkDependencies = async () => {
  const failedChecks = new Set();
  const list = createTaskList(failedChecks);
  const tasks = new Listr(list, { exitOnError: false, concurrent: false });

  try {
    await tasks.run();
    console.log(chalk`\n{green Great! You're ready to get started 😋 }\n`);
    return;
  } catch {
    console.log(chalk`\n{yellow Some dependencies are missing }\n`);
  }

  if (failedChecks.size <= 0) {
    return;
  }

  const values = Array.from(failedChecks.values()).map(name => ({
    type: 'confirm',
    message: dependencies[name].question,
    name,
  }));

  const result = await inquirer.prompt<Record<string, boolean>>(values);
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
