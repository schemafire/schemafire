import { start } from '@google-cloud/debug-agent';
import admin from 'firebase-admin';
import { resolve } from 'path';

export class Env {
  public static functions: any;
  private static initialized = false;

  public static get isDev() {
    return true;
  }

  public static get isProd() {
    return !Env.isDev;
  }

  private static serviceAccountKey =
    process.env.LOCAL_DEPLOY === 'true'
      ? require('../../../support/secrets/key.json')
      : Env.isDev
      ? require('../secret.json')
      : require('../secret.json');

  public static get info() {
    return Env.isDev
      ? {
          credential: admin.credential.cert(Env.serviceAccountKey),
          databaseURL: 'https://plejio-test.firebaseio.com',
          projectId: 'plejio-test',
          storageBucket: 'plejio-test.appspot.com',
        }
      : {
          credential: admin.credential.cert(Env.serviceAccountKey),
          databaseURL: 'https://plejio-test.firebaseio.com',
          projectId: 'plejio-test',
          storageBucket: 'plejio-test.appspot.com',
        };
  }

  public static debug = start({
    allowExpressions: true,
    projectId: Env.info.projectId,
    keyFilename: resolve(__dirname, '../../secret.json'),
    appPathRelativeToRepository: '@cloud/firebase',
  });

  public static initializeApp() {
    if (Env.initialized) {
      return;
    }
    if (process.env.LOCAL_DEPLOY === 'true') {
      admin.initializeApp(Env.info);
    } else {
      // ! This is here because firebase realtime db isn't able to read from the environment even in the production serverless firebase function.
      // ? Once there's a fix this be run with no arguments
      admin.initializeApp(Env.info);
      // admin.initializeApp();
    }

    const settings = { timestampsInSnapshots: true };
    const firestore = admin.firestore();
    firestore.settings(settings);
    Env.initialized = true;
  }
}

Env.initializeApp();
