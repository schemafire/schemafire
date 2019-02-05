import admin from 'firebase-admin';

export const testCollection = (name: string) => `${global.__DB_PREFIX__}/${name}`;

const TEST_PROJECT_CONFIG = require('../../../../support/secrets/db.json');

/**
 * Initialized firebase admin and return the instance of firestore.
 */
export const initializeFirebase = () => {
  const serviceAccountKey = require('../../../../support/secrets/key.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    databaseURL: TEST_PROJECT_CONFIG.databaseURL,
    projectId: TEST_PROJECT_CONFIG.projectId,
  });
};

export const initializeFirebaseWithoutConfig = () => {
  admin.initializeApp();
};
