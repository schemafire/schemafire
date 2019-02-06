import { Omit, tuple } from '@schemafire/core';
import admin from 'firebase-admin';
import * as t from 'io-ts';
import { omit } from 'lodash/fp';

/**
 * Checks if a value is a FirestoreAdmin Timestamp reference
 * @param u unknown value
 */
export const isFirestoreAdminTimestamp = (u: unknown): u is FirebaseFirestore.Timestamp =>
  u instanceof admin.firestore.Timestamp;

/**
 * Checks if a value is a document reference
 * @param u unknown value
 */
export const isDocumentReference = (u: unknown): u is FirebaseFirestore.DocumentReference =>
  u instanceof admin.firestore.DocumentReference;

/**
 * Checks if a value is a collection reference
 * @param u unknown value
 */
export const isCollectionReference = (u: unknown): u is FirebaseFirestore.CollectionReference =>
  u instanceof admin.firestore.CollectionReference;

/**
 * Checks if a value is a firestore geo point
 * @param u unknown value
 */
export const isGeoPoint = (u: unknown): u is FirebaseFirestore.GeoPoint =>
  u instanceof admin.firestore.GeoPoint;

/**
 * A timestamp type for Firestore data. Allows creating a validation
 * field which can be used to ensure time data is correct.
 */
export const timestamp = new t.Type<admin.firestore.Timestamp>(
  'Timestamp',
  isFirestoreAdminTimestamp,
  (m, c) => (isFirestoreAdminTimestamp(m) ? t.success(m) : t.failure(m, c)),
  t.identity,
);

/**
 * Codec for document references
 */
export const documentReference = new t.Type<FirebaseFirestore.DocumentReference>(
  'DocumentReference',
  isDocumentReference,
  (u, c) => (isDocumentReference(u) ? t.success(u) : t.failure(u, c)),
  t.identity,
);

/**
 * Codec for Collection references
 */
export const collectionReference = new t.Type<FirebaseFirestore.CollectionReference>(
  'CollectionReference',
  isCollectionReference,
  (u, c) => (isCollectionReference(u) ? t.success(u) : t.failure(u, c)),
  t.identity,
);

/**
 * Codec for GeoPoints
 */
export const geoPoint = new t.Type<FirebaseFirestore.GeoPoint>(
  'GeoPoint',
  isGeoPoint,
  (u, c) => (isGeoPoint(u) ? t.success(u) : t.failure(u, c)),
  t.identity,
);

/**
 * The lowest level definition object
 */
export interface BaseDefinition {
  readonly createdAt: FirebaseFirestore.Timestamp;
  readonly updatedAt: FirebaseFirestore.Timestamp;
  readonly schemaVersion: number;
}

export const baseProps = tuple('createdAt', 'updatedAt', 'schemaVersion');

export const omitBaseFields: <T extends BaseDefinition>(
  obj: any,
) => Omit<T, keyof BaseDefinition> = omit(baseProps);

export const createDefaultBase = (base: Partial<BaseDefinition> = {}): BaseDefinition => ({
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now(),
  schemaVersion: 0,
  ...base,
});

export { numbers, utils, strings } from '@schemafire/core';
