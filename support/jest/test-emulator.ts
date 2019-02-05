import chalk from 'chalk';
import dbg from 'debug';
import execa from 'execa';
import Listr from 'listr';
import { startCase } from 'lodash';
import psTree from 'ps-tree';
import waitOn from 'wait-on';

const debug = dbg('test-emulator');

const URLS: Record<ServeTypes, string> = {
  firebase: 'http://localhost:8081',
  firestore: 'tcp:8080',
};

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

type ServeTypes = 'firebase' | 'firestore';
interface ProcessData {
  emulator?: execa.ExecaChildProcess;
  stopped: boolean;
}

interface NameErrorObject {
  error: Error;
  name: ServeTypes;
}

export class TestEmulator {
  private static readonly data: Record<ServeTypes, ProcessData> = {
    firebase: { stopped: true },
    firestore: { stopped: true },
  };

  private static serve(name: ServeTypes) {
    debug(`${startCase(name)}: Starting server`);
    return execa('firebase', ['serve', '--only', name], { stdio: 'ignore' });
  }

  public static async startFirestore() {
    if (!TestEmulator.data.firestore.stopped) {
      debug(
        'There is a firestore process already running. Skipping this `startFirestore` command.',
      );
      return;
    }
    debug('Starting firestore emulator.');

    TestEmulator.data.firestore = {
      emulator: TestEmulator.serve('firestore'),
      stopped: false,
    };

    const tasks = new Listr([
      {
        title: 'Starting the Firestore emulator',
        task: () =>
          TestEmulator.createWaitPromise('firestore')
            .catch(TestEmulator.stopServer('firestore'))
            .then(() => 'Successfully started the firestore emulator'),
      },
    ]);

    return tasks.run();
  }

  public static async stopFirestore() {
    if (TestEmulator.data.firestore.stopped) {
      debug("There is no firestore process running. Can't close the server");
      return;
    }
    debug('Killing the firestore emulator.');

    const closeServer = TestEmulator.stopServer('firestore');

    const tasks = new Listr([
      {
        title: 'Stopping the Firestore emulator',
        task: () =>
          closeServer()
            .catch(TestEmulator.stopServer('firestore'))
            .then(() => 'Successfully stopped the emulator'),
      },
    ]);

    return tasks.run();
  }

  private static unexpectedClosure = (
    name: ServeTypes,
    reject: (reason: NameErrorObject) => void,
  ) => () => {
    reject({ error: new Error(`${startCase(name)} closed unexpectedly`), name });
  };

  private static createWaitPromise(name: ServeTypes) {
    const data = TestEmulator.data[name];
    const url = URLS[name];
    if (!data.emulator) {
      return Promise.resolve();
    }
    const emulator = data.emulator;
    return new Promise<void>((resolve, reject) => {
      const onClose = TestEmulator.unexpectedClosure(name, reject);
      emulator.on('close', onClose);
      debug('Starting waitOn %s', url);

      return waitOn({
        resources: [url],
        interval: 500,
        window: 1000,
        verbose: false,
        log: false,
      })
        .then(() => {
          debug('Successfully found the port');
          emulator.removeListener('close', onClose);
          resolve();
        })
        .catch(err => {
          debug('Error waiting for url %s', url);
          debug('An error occurred: %s', err.message);
          reject(err);
        });
    });
  }

  /**
   * Closes the process for the provided reason
   */
  private static stopServer = (name: ServeTypes) => (error?: Error) => {
    const data = TestEmulator.data[name];
    if (data.stopped || !data.emulator) {
      debug(`${startCase(name)} process has already been stopped.`);
      return Promise.resolve();
    }

    const emulator = data.emulator;

    // Reset the data for this server
    TestEmulator.data[name] = { stopped: true, emulator: undefined };

    return psTreePromise(emulator.pid)
      .then(children => {
        children.forEach(child => {
          try {
            process.kill(parseInt(child.PID, 10), 'SIGINT');
          } catch (e) {
            if (e.code === 'ESRCH') {
              console.log(chalk`{red Child process ${child.PID} exited before trying to stop it }`);
            } else {
              throw e;
            }
          }
        });
      })
      .then(() => {
        emulator.kill();
        if (error) {
          throw error;
        }
      });
  };
}
