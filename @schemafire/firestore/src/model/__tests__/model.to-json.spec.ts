import { initializeFirebaseWithoutConfig, testCollection } from '@live-test-helpers';
import { Cast, utils } from '@schemafire/core';
import admin from 'firebase-admin';
import * as t from 'io-ts';
import { schema } from '../../__fixtures__/shared.fixtures';
import { baseProps, collectionReference, documentReference, geoPoint } from '../../base';
import { Schema } from '../../schema';
import { ModelTypeOfSchema } from '../../types';

jest.unmock('firebase-admin');
initializeFirebaseWithoutConfig();

describe('#toJSON', () => {
  let model: ModelTypeOfSchema<typeof schema>;
  beforeEach(() => {
    model = schema.model({ schema });
  });
  it('should implement', () => {
    expect(model.toJSON()).toContainKeys([...Object.keys(model.schema.codec.props), ...baseProps, 'id']);
  });

  const codec = t.type({
    geo: geoPoint,
    doc: documentReference,
    coll: collectionReference,
    normal: utils.genericDictionary<{ a: string }>('a', u => u && Cast(u).a),
  });

  const coll = admin.firestore().collection(testCollection('any-coll'));
  const doc = admin.firestore().doc('any-coll/any-doc');
  const complexSchema = new Schema({
    codec,
    defaultData: {
      coll,
      doc,
      geo: new admin.firestore.GeoPoint(0, 0),
      normal: { a: 'awesome' },
    },
    collection: 'complex-collection',
  });

  it('returns the correct values', () => {
    const m = complexSchema.model({});
    const json = m.toJSON();
    expect(json.createdAt.type).toBe('timestamp');
    expect(json.normal).toEqual({ a: 'awesome' });
    expect(json.geo).toEqual({ type: 'geo', data: { longitude: 0, latitude: 0 } });
    expect(json.doc).toEqual({ type: 'doc', data: doc.path });
    expect(json.coll).toEqual({ type: 'coll', data: coll.path });
  });
});
