import type * as firestore from '@google-cloud/firestore';
import type * as admin from 'firebase-admin';

export interface Adaptor {
  firestore: admin.firestore.Firestore;
  constants: AdaptorConstants;
}

export type AdaptorFirestore = () => admin.firestore.Firestore;

export interface AdaptorConstants {
  DocumentReference: typeof admin.firestore.DocumentReference;
  Timestamp: typeof admin.firestore.Timestamp;
  FieldValue: typeof admin.firestore.FieldValue;
}

export type FirestoreQuery = admin.firestore.Query;
export type FirestoreDocumentReference = admin.firestore.DocumentReference;
export type FirestoreDocumentData = admin.firestore.DocumentData;
export type FirestoreTimestamp = admin.firestore.Timestamp;
export type FirebaseWriteBatch = admin.firestore.WriteBatch;
export type FirestoreCollectionReference = admin.firestore.CollectionReference;
export type FirestoreTransaction = admin.firestore.Transaction;
// TODO: Use admin reference after they added to firebase-admin
export type FirestoreOrderByDirection = firestore.OrderByDirection;
export type FirestoreWhereFilterOp = firestore.WhereFilterOp;
