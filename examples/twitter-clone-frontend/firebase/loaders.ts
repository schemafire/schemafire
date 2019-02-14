import fTypeOnly from 'firebase';
import { once } from 'lodash/fp';
import { combineLatest, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FirebaseImports,
  RxfireAuth,
  RxfireDatabase,
  RxfireFirestore,
  RxfireFunctions,
} from '../typings/firebase.types';
import { MutationFunction, QueryFunction } from '../utils/constants';

type Firebase = typeof fTypeOnly;

const defaultConfig = {
  apiKey: 'AIzaSyByftmIRGmAUkl4KHNXBVXY1C7gBVwLoA0',
  authDomain: 'plejio-test.firebaseapp.com',
  databaseURL: 'https://plejio-test.firebaseio.com',
  projectId: 'plejio-test',
  storageBucket: 'plejio-test.appspot.com',
  messagingSenderId: '619783214774',
  // ? How to pass this value into the codebase. Perhaps pick it up on the server and pass it through.
  publicMessagingKey:
    'BNeaSEcWjZMkO0EbenXl4Em66PM_USziaH7hGUzXvOFGnDlUsRilMRRQHC3ebQx55PeBfhdUPtZBnhLh1_aSqiw',
};

function initializeFirebase(firebaseImport: Firebase, config: object = defaultConfig) {
  if (firebaseImport.apps[0]) {
    return { app: firebaseImport.apps[0], firebase: firebaseImport };
  }

  const app = firebaseImport.initializeApp(config);
  return { app, firebase: firebaseImport };
}

const firebaseMapper = once(([firebaseImport]: [Firebase]) => {
  return initializeFirebase(firebaseImport);
});

function loadFirebase() {
  const app$ = from(import('firebase/app'));
  return combineLatest(app$).pipe(map(firebaseMapper));
}

const firestoreMapper = once(([imports, rxfireFirestore]: [FirebaseImports, RxfireFirestore, {}]) => {
  const firestore = imports.app.firestore();
  const settings = { timestampsInSnapshots: true };
  firestore.settings(settings);
  firestore.enablePersistence({ experimentalTabSynchronization: true }).catch(error => {
    console.warn('lazy-loader', 'There was a problem enabling persistence', error);
  });
  return { ...imports, rxfireFirestore };
});

export function loadFirestore() {
  const imports$ = loadFirebase();
  const rxfireFirestore$ = from(import('rxfire/firestore'));
  const firestore$ = from(import('firebase/firestore'));
  return combineLatest(imports$, rxfireFirestore$, firestore$).pipe(map(firestoreMapper));
}

const authMapper = once(([imports, , rxfireAuth]: [FirebaseImports, {}, RxfireAuth]) => {
  const auth = imports.app.auth();
  const user$ = rxfireAuth.user(imports.app.auth());
  const authState$ = rxfireAuth.authState(auth);
  const idToken$ = rxfireAuth.idToken(auth);
  return { user$, authState$, idToken$, rxfireAuth, auth, ...imports };
});

export function loadAuth() {
  const imports$ = loadFirebase();
  const auth$ = from(import('firebase/auth'));
  const rxfireAuth$ = from(import('rxfire/auth'));
  return combineLatest(imports$, auth$, rxfireAuth$).pipe(map(authMapper));
}

const functionsMapper = once(([imports, , rxfireFunctions]: [FirebaseImports, {}, RxfireFunctions]) => {
  const functions = imports.app.functions();
  functions.useFunctionsEmulator('http://localhost:5000');

  const callableMutation = rxfireFunctions.httpsCallable<any, { success: boolean }>(
    functions,
    MutationFunction,
  );
  const callableQuery = rxfireFunctions.httpsCallable<any, { success: boolean }>(functions, QueryFunction);
  return { callableMutation, callableQuery, ...imports };
});

export function loadFunctions() {
  const imports$ = loadFirebase();
  const functions$ = from(import('firebase/functions'));
  const rxfireFunctions$ = from(import('rxfire/functions'));

  return combineLatest(imports$, functions$, rxfireFunctions$).pipe(map(functionsMapper));
}

const onTokenRefresh = (messaging: firebase.messaging.Messaging): Observable<void> => {
  return new Observable(subscriber => {
    const unsubscribe = messaging.onTokenRefresh(subscriber);
    return { unsubscribe };
  });
};

const onMessage = (messaging: firebase.messaging.Messaging): Observable<any> => {
  return new Observable(subscriber => {
    const unsubscribe = messaging.onMessage(subscriber);
    return { unsubscribe };
  });
};

const loadMessagingMap = once(([imports]: [FirebaseImports, {}]) => {
  const messaging = imports.app.messaging();
  messaging.usePublicVapidKey(defaultConfig.publicMessagingKey);
  const tokenRefresh$ = onTokenRefresh(messaging);
  const message$ = onMessage(messaging);
  return { messaging, tokenRefresh$, message$, ...imports };
});

export function loadMessaging() {
  const imports$ = loadFirebase();
  const messaging$ = from(import('firebase/messaging'));
  return combineLatest(imports$, messaging$).pipe(map(loadMessagingMap));
}

const databaseMapper = once(([imports, rxfireDatabase]: [FirebaseImports, RxfireDatabase, {}]) => {
  return { rxfireDatabase, ...imports, database: imports.firebase.database() };
});

export function loadDatabase() {
  const imports$ = loadFirebase();
  const database$ = from(import('firebase/database'));
  const rxfireDatabase$ = from(import('rxfire/database'));

  return combineLatest(imports$, rxfireDatabase$, database$).pipe(map(databaseMapper));
}

// export const epicDependencies = {
//   lazyFirestore: once(loadFirestore),
//   lazyAuth: once(loadAuth),
//   lazyFirebase: once(loadFirebase),
//   lazyFunctions: once(loadFunctions),
//   lazyMessaging: once(loadMessaging),
//   lazyDatabase: once(loadDatabase),
//   lazyIntl: memoize(loadIntl),
// };
