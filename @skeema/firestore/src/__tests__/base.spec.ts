import { initializeFirebase, testCollection } from '@live-test-helpers';
import { ThrowReporter } from '@skeema/core';
import admin from 'firebase-admin';
import {
  baseCodec,
  collectionReference,
  createDefaultBase,
  documentReference,
  timestamp,
} from '../base';

jest.unmock('firebase-admin');

initializeFirebase();
const db = admin.firestore();

test('baseDefinition', () => {
  expect(() => ThrowReporter.report(baseCodec.decode(createDefaultBase()))).not.toThrowError();
  expect(() => ThrowReporter.report(baseCodec.decode({ schemaVersion: 1 })))
    .toThrowErrorMatchingInlineSnapshot(`
"Invalid value undefined supplied to : Readonly<{ createdAt: Timestamp, updatedAt: Timestamp, schemaVersion: Integer }>/createdAt: Timestamp
Invalid value undefined supplied to : Readonly<{ createdAt: Timestamp, updatedAt: Timestamp, schemaVersion: Integer }>/updatedAt: Timestamp"
`);
});

test('collectionReference', () => {
  const collection = db.collection(testCollection('any'));
  expect(() =>
    ThrowReporter.report(collectionReference.decode({})),
  ).toThrowErrorMatchingInlineSnapshot(`"Invalid value {} supplied to : CollectionReference"`);
  expect(() => ThrowReporter.report(collectionReference.decode(collection))).not.toThrowError();
});

test('documentReference', () => {
  const document = db.doc(testCollection('any/all/the/things'));
  expect(() =>
    ThrowReporter.report(documentReference.decode({})),
  ).toThrowErrorMatchingInlineSnapshot(`"Invalid value {} supplied to : DocumentReference"`);
  expect(() => ThrowReporter.report(documentReference.decode(document))).not.toThrowError();
});

test('timestamp', () => {
  const now = admin.firestore.Timestamp.now();
  expect(() => ThrowReporter.report(timestamp.decode(new Date()))).toThrowError();
  expect(() => ThrowReporter.report(timestamp.decode(now))).not.toThrowError();
});
