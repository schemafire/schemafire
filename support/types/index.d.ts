// tslint:disable-next-line:no-namespace
declare namespace NodeJS {
  interface Global {
    TestEmulator: TestEmulator;
    __TEST__: boolean;
    __DEV__: boolean;
    __DB_PREFIX__: string;
  }
}

declare class TestEmulator {
  public static startFirestore: Promise<any>;
  public static stopFirestore: Promise<any>;
}
