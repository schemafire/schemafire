import admin from 'firebase-admin';
import FirebaseFunctionTest from 'firebase-functions-test';

export const testCollection = (name: string) => `${global.__DB_PREFIX__}/${name}`;

export { WrappedFunction } from 'firebase-functions-test/lib/main';

const TEST_PROJECT_CONFIG = require('../../../../config/test/db.json');

/**
 * Create the tester that is used to wrap our firebase functions test code.
 */
export const createLiveFunctionsTester = (unitTest: boolean = false) => {
  if (unitTest) {
    return FirebaseFunctionTest();
  }
  const inRoot = process.cwd().includes('@functions');
  return FirebaseFunctionTest(
    TEST_PROJECT_CONFIG,
    `${inRoot ? '../' : './'}secrets/firebase/test-secret.json`,
  );
};

/**
 * Initialized firebase admin and return the instance of firestore.
 * @param standalone means that the code directly initializes with all the required config
 */
export const initializeTestFirebase = (standalone: boolean = false) => {
  if (standalone) {
    const serviceAccountKey = require('../../../../config/test/key.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      databaseURL: TEST_PROJECT_CONFIG.databaseURL,
      projectId: TEST_PROJECT_CONFIG.projectId,
    });
  } else {
    admin.initializeApp();
  }
  const firestore = admin.firestore();
  return firestore;
};
