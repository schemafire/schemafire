import admin from 'firebase-admin';
import { Change } from 'firebase-functions/lib/cloud-functions';
import { FunctionsErrorCode, HttpsError } from 'firebase-functions/lib/providers/https';
import { get, isEqual } from 'lodash';
import { pipe } from 'lodash/fp';
import generate from 'nanoid/generate';

/**
 * Generates a unique id of provided length.
 */
export const generateId = (val: number = 24) => generate('abcdefghijklmnopqrstuvwxyz', val);

/**
 * Type cast an argument
 * @param arg
 */
export const Cast = <T = any>(arg: any): T => arg;

export const DEFAULT_RETRIES = 2;

/**
 * Firestore doesn't allow undefined as a value.
 */
export const removeUndefined = <T extends {}>(obj: T) => {
  return Object.entries(obj).reduce(
    (accum, [key, val]) => ({
      ...accum,
      ...(val !== undefined ? { [key]: val } : {}),
    }),
    Cast<T>({}),
  );
};

export const serverCreateTimestamp = <T extends object>(data: T) => ({
  ...data,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

export const serverUpdateTimestamp = <T extends object>(data: T) => ({
  ...data,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

export const serverCreateUpdateTimestamp: (
  obj: object,
) => object & {
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
} = pipe(
  serverUpdateTimestamp,
  serverCreateTimestamp,
);

export const safeFirestoreCreateUpdate: (
  obj: object,
) => object & {
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
} = pipe(
  removeUndefined,
  serverCreateUpdateTimestamp,
);

export const safeFirestoreCreate: (
  obj: object,
) => object & {
  createdAt: FirebaseFirestore.FieldValue;
} = pipe(
  removeUndefined,
  serverCreateTimestamp,
);

export const safeFirestoreUpdate: (
  obj: object,
) => object & {
  updatedAt: FirebaseFirestore.FieldValue;
} = pipe(
  removeUndefined,
  serverUpdateTimestamp,
);

export interface ErrorDetails {
  [x: string]: string | object;
}

export interface ErrorParams {
  status: FunctionsErrorCode;
  message: string;
  details?: ErrorDetails;
}

export const createError = ({ status, message, details }: ErrorParams) => {
  const error = new HttpsError(status, message, details);
  logError(error);
  return error;
};

/**
 * Checks whether the path in question has changed via an update
 * @param path
 * @param snap
 */
export const pathExistsAndHasChanged = (
  path: string | string[],
  snap: Change<FirebaseFirestore.DocumentSnapshot>,
) => {
  const before = get(snap.before.data(), path);
  const after = get(snap.after.data(), path);
  return after && !isEqual(before, after) ? true : false;
};

/**
 * Log an error but not in the test environment
 */
export function logError(message: string, error?: Error): void;
export function logError(error: Error): void;
export function logError(message: string | Error, error?: Error) {
  if (isTestEnv() || (error && error.message && error.message.toLowerCase() === 'test')) {
    return;
  }
  console.error(message, error);
}

/**
 * Log an error but not in the test environment.
 */
export const simpleError = (message: string) => {
  return new Error(message);
};

/**
 * For some reason process.env.NODE_ENV becomes undefined when importing a module whilst running jest tests.
 * This uses the injected Jest Environment to determine whether a test is currently running.
 */
export const isTestEnv = () => {
  return process.env.NODE_ENV === 'test' || global.__TEST__ ? true : false;
};
