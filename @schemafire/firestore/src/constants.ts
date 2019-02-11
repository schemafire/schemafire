import admin from 'firebase-admin';
import { SchemaConfig } from './types';

/**
 * The schema config used throughout the app.
 */
export const SCHEMA_CONFIG: SchemaConfig = Object.freeze({
  mirror: true,
  autoValidate: true,
  databaseGetter: admin.firestore,
  forceGet: false,
  maxAttempts: 5,
  testMode: false,
  emptyCollection: false,
});
