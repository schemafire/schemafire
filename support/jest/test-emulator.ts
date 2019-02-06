import chalk from 'chalk';
import debug from 'debug';
import execa from 'execa';
import Listr from 'listr';
import { startCase } from 'lodash';
import waitOn from 'wait-on';
import { checkEmulatorInstalled, EmulatorType, killEmulator } from '../scripts/dependencies';

const log = debug('test:emulator');

const URLS: Record<EmulatorType, string> = {
  database: 'tcp:8080',
  firestore: 'tcp:8080',
};

interface ProcessData {
  emulator?: execa.ExecaChildProcess;
  stopped: boolean;
}

interface NameErrorObject {
  error: Error;
  name: EmulatorType;
}

export class TestEmulator {
  private static emulatorInstalled: Record<EmulatorType, boolean> = {
    database: false,
    firestore: false,
  };

  private static readonly data: Record<EmulatorType, ProcessData> = {
    database: { stopped: true },
    firestore: { stopped: true },
  };

  private static serve(name: EmulatorType) {
    log(`${startCase(name)}: Starting server`);
    return execa('firebase', ['serve', '--only', name], { stdio: 'ignore' });
  }

  /**
   * Starts the firestore service
   */
  public static async start(type: EmulatorType) {
    if (!TestEmulator.data.firestore.stopped) {
      log(`There is a ${type} process already running. Skipping this \`start:${type}\` command.`);
      return;
    }
    log(`Starting ${type} emulator`);
    const emulator = TestEmulator.serve(type);
    TestEmulator.data[type] = {
      emulator,
      stopped: false,
    };

    const tasks = new Listr([
      {
        title: `Checking for ${type} emulator`,
        task: ctx =>
          checkEmulatorInstalled({ type, alwaysKill: false, emulator })
            .then(() => {
              ctx.start = true;
              TestEmulator.emulatorInstalled[type] = true;
              return 'Success';
            })
            .catch(() => {
              ctx.start = false;
              TestEmulator.emulatorInstalled[type] = false;
              throw new Error('The emulator has not been set up properly');
            }),
      },
      {
        // Wait for the emulator to be running
        title: `Starting the ${type} emulator`,
        enabled: ctx => ctx.start === true,
        task: () =>
          TestEmulator.createWaitPromise(type)
            .catch(TestEmulator.stopServer(type))
            .then(() => `Successfully started the ${type} emulator`),
      },
    ]);

    try {
      await tasks.run();
      log(`${startCase(type)} Emulator successfully deployed`);
    } catch (error) {
      error.message = chalk`${
        error.message
      } - Please install with {grey \`firebase setup:emulators:${type}\` } before running tests`;
      throw error;
    }
  }

  public static async stop(type: EmulatorType) {
    if (TestEmulator.emulatorInstalled[type] === false) {
      log(`No ${type} emulator has been installed`);
      return;
    }

    if (TestEmulator.data[type].stopped) {
      log(`There is no ${type} process running. Can't close the server.`);
      return;
    }

    log(`Killing the ${type} emulator`);

    const closeServer = TestEmulator.stopServer(type);

    const tasks = new Listr([
      {
        title: `Stopping ${type} emulator`,
        task: () =>
          closeServer()
            .catch(error => {
              log('An unexpected error occurred trying to close the emulator: %s', error.message);
              throw new Error('There was a problem');
            })
            .then(() => 'Success'),
      },
    ]);

    return tasks.run().catch(() => log(`Swallowing an error when stopping ${type}`));
  }

  private static unexpectedClosure = (
    name: EmulatorType,
    reject: (reason: NameErrorObject) => void,
  ) => () => {
    reject({ error: new Error(`${startCase(name)} closed unexpectedly`), name });
  };

  private static createWaitPromise(name: EmulatorType) {
    const data = TestEmulator.data[name];
    const url = URLS[name];
    if (!data.emulator) {
      return Promise.resolve();
    }
    const emulator = data.emulator;
    return new Promise<void>((resolve, reject) => {
      const onClose = TestEmulator.unexpectedClosure(name, reject);
      emulator.on('close', onClose);
      log('Starting waitOn %s', url);

      waitOn({
        resources: [url],
        interval: 500,
        timeout: 10000,
        verbose: false,
        log: false,
      })
        .then(() => {
          log('Successfully found the port');
          emulator.removeListener('close', onClose);
          resolve();
        })
        .catch(err => {
          log('Error waiting for url %s', url);
          log('An error occurred: %s', err.message);
          reject(err);
        });
    });
  }

  /**
   * Closes the process for the provided reason
   */
  private static stopServer = (name: EmulatorType) => (error?: Error) => {
    log('Stopping the emulator: %s', startCase(name));

    const data = TestEmulator.data[name];
    if (data.stopped || !data.emulator) {
      log(`${startCase(name)} process has already been stopped.`);
      return Promise.resolve();
    }

    // Reset the data for this emulator
    TestEmulator.data[name] = { stopped: true, emulator: undefined };

    return killEmulator(data.emulator).then(() => {
      if (error) {
        log('Stopping the emulator %s with error: %s', startCase(name), error.message || error);
        throw error;
      }
    });
  };
}
