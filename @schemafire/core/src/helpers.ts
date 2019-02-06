import generate from 'nanoid/generate';

/**
 * Generates a unique id of provided length.
 */
export const generateId = (val: number = 24) => generate('abcdefghijklmnopqrstuvwxyz', val);

/**
 * Type cast an argument. If not type is provided it defaults to any
 * Provides A sneaky way to step around tricky TypeScript bugs 😅
 *
 * @param arg
 */
export const Cast = <GNewType = any>(arg: any): GNewType => arg;

/**
 * Removes all undefined values from an object. Neither Firestore nor the RealtimeDB allow `undefined` as a value.
 *
 * @param data The object to clean
 */
export const removeUndefined = <T extends {}>(data: T) => {
  return Object.entries(data).reduce(
    (current, [key, val]) => ({
      ...current,
      ...(val !== undefined ? { [key]: val } : {}),
    }),
    Cast<T>({}),
  );
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
