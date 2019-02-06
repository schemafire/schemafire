import firebaseTesting from '@firebase/testing';
import admin from 'firebase-admin';

export const testCollection = (name: string) => `${global.__DB_PREFIX__}/${name}`;

/**
 * Initialized firebase admin and return the instance of firestore.
 *
 * This uses a live instance firebase and must be setup in advance
 */
export const initializeLiveFirebase = () => {
  const serviceAccountKey = require('../../../../support/secrets/key.json');
  const TEST_PROJECT_CONFIG = require('../../../../support/secrets/db.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    databaseURL: TEST_PROJECT_CONFIG.databaseURL,
    projectId: TEST_PROJECT_CONFIG.projectId,
  });
};

export const initializeFirebaseWithoutConfig = () => {
  admin.initializeApp();
};

export const setupFirebaseTesting = async () => {
  const app = await firebaseTesting.initializeAdminApp({
    projectId: global.__DB_PREFIX__,
  });

  const db = app.firestore();
  return db;
};

export type FirestoreTesting = firebaseTesting.firestore.Firestore;

export const teardownFirebaseTesting = async () => {
  await Promise.all(firebaseTesting.apps().map(app => app.delete()));
};
