export * from './definitions';
export * from './helpers';
export * from './types';

/*
TODO Figure out how to gain repo-wide access to these types without polluting the namespace of consumers
*/
declare global {
  namespace NodeJS {
    interface Global {
      __TEST__: boolean;
      __DEV__: boolean;
      __DB_PREFIX__: string;
    }
  }
}
