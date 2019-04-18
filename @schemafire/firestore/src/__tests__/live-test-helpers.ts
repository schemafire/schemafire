import { firestore, initializeAdminApp } from '@firebase/testing';
import admin from 'firebase-admin';
import { FirestoreRecord } from '../types';

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

export const setupFirebaseTesting = () => {
  const app = initializeAdminApp({
    projectId: 'TEST',
  });

  const db = app.firestore();
  return db;
};

export type FirestoreTesting = firestore.Firestore;

/**
 * Retrieve any document from any firestore collection.
 *
 * @param documentId
 * @param collection
 */
export const getDocument = async <T extends {}>(
  documentId: string,
  collection: string,
): Promise<FirestoreRecord<T>> => {
  const doc = admin
    .firestore()
    .collection(collection)
    .doc(documentId);
  const snap = await doc.get();
  const data = snap.exists ? (snap.data() as T) : undefined;
  return { doc, snap, data };
};
