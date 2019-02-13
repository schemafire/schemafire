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
      : require('../secret.json');

  public static get info() {
    return process.env.LOCAL_DEPLOY === 'true'
      ? require('../../../support/secrets/db.json')
      : {
          credential: admin.credential.cert(Env.serviceAccountKey),
          ...require('../db.json'),
        };
  }

  public static debug = start({
    allowExpressions: true,
    projectId: Env.info.projectId,
    keyFilename: resolve(__dirname, '../secret.json'),
    appPathRelativeToRepository: '@cloud/firebase',
  });

  public static initializeApp() {
    if (Env.initialized) {
      return;
    }
    admin.initializeApp(Env.info);

    const settings = { timestampsInSnapshots: true };
    const firestore = admin.firestore();
    firestore.settings(settings);
    Env.initialized = true;
  }
}

Env.initializeApp();
