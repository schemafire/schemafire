// tslint:disable-next-line:no-namespace
declare namespace NodeJS {
  interface Global {
    __TEST__: boolean;
    __DEV__: boolean;
    __DB_PREFIX__: string;
  }
}

declare module 'firebase-tools';
declare module './utils';
