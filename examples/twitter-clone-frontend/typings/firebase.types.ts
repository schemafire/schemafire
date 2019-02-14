import { NonFunctionProperties } from '@schemafire/core';
import fTypeOnly from 'firebase';
import RxfireAuthImport from 'rxfire/auth';
import RxfireDatabaseImport from 'rxfire/database';
import RxfireFirestoreImport from 'rxfire/firestore';
import RxfireFunctionsImport from 'rxfire/functions';
import RxfireStorageImport from 'rxfire/storage';

export type RealTimeServerValue = typeof fTypeOnly.database.ServerValue;
export type Firebase = typeof fTypeOnly;
export type RxfireFunctions = typeof RxfireFunctionsImport;
export type RxfireAuth = typeof RxfireAuthImport;
export type RxfireStorage = typeof RxfireStorageImport;
export type RxfireFirestore = typeof RxfireFirestoreImport;
export type RxfireDatabase = typeof RxfireDatabaseImport;
export type FirebaseUser = fTypeOnly.User;

export interface FirebaseImports {
  app: fTypeOnly.app.App;
  firebase: Firebase;
}

export type FirebaseUserProperty = NonFunctionProperties<FirebaseUser>;
