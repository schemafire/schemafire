import { getAll } from './utils';
import { AdaptorFirestore, AdaptorConstants, Adaptor } from './types';

let currentFirestore: AdaptorFirestore;
let currentConstants: AdaptorConstants;

export async function adaptor(): Promise<Adaptor> {
  if (typeof document !== 'undefined') {
    const { default: firebase } = await import('firebase/app');
    await import('firebase/firestore');

    const firestore = firebase.firestore();
    // At the moment, the browser's Firestore adaptor doesn't support getAll.
    // Get rid of the fallback when the issue is closed:
    // https://github.com/firebase/firebase-js-sdk/issues/1176
    if (!('getAll' in firestore)) Object.assign(firestore, { getAll });

    return {
      firestore,
      constants: {
        DocumentReference: firebase.firestore.DocumentReference,
        Timestamp: firebase.firestore.Timestamp,
        FieldValue: firebase.firestore.FieldValue,
      },
    } as any;
  }

  const { firestore } = await import('firebase-admin');

  const adminFirestore = currentFirestore ?? (() => firestore());
  const AdminConstants = currentConstants ?? {
    DocumentReference: firestore.DocumentReference,
    Timestamp: firestore.Timestamp,
    FieldValue: firestore.FieldValue,
  };

  return {
    firestore: adminFirestore(),
    constants: AdminConstants,
  };
}

export function injectAdaptor(firestore: AdaptorFirestore, constants: AdaptorConstants) {
  if (typeof document !== 'undefined') {
    throw new Error('Injecting adaptor is not supported in the browser environment');
  }

  currentFirestore = firestore;
  currentConstants = constants;
}

export const I_AM_SERVER = 'I AM A SERVER';
