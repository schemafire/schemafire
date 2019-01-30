import { Omit } from '@skeema/core';
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
 * The lowest level definition object
 */
export const baseCodecObject = {
  createdAt: timestamp,
  updatedAt: timestamp,
  schemaVersion: t.Integer,
};

export const baseCodec = t.readonly(t.interface(baseCodecObject));

export type BaseDefinition = t.TypeOf<typeof baseCodec>;
export type PropsWithBase<GProps extends t.Props> = GProps & typeof baseCodecObject;
export type TypeOfPropsWithBase<GProps extends t.AnyProps> = t.TypeOfProps<PropsWithBase<GProps>>;

export const omitBaseFields: <T extends BaseDefinition>(
  obj: T,
) => Omit<T, keyof BaseDefinition> = omit(['createdAt', 'updatedAt', 'schemaVersion']);

export const createDefaultBase = (base: Partial<BaseDefinition> = {}): BaseDefinition => ({
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now(),
  schemaVersion: 0,
  ...base,
});

export { numbers, utils, strings } from '@skeema/core';
