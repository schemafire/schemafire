import { testCollection } from '@live-test-helpers';
import { Cast } from '@skeema/core';
import {
  collectionRef,
  docData,
  runTransaction,
  snapData,
} from '@skeema/jest-mocks/lib/firebase-admin';
import admin from 'firebase-admin';
import { codec, defaultData, realData } from '../__fixtures__/shared.fixtures';
import { Model } from '../model';
import { Query } from '../query';
import { Schema } from '../schema';
import { SkeemaValidationError } from '../validation';

const collection = testCollection('base');
const mock = jest.fn();

const dependencies = { initialized: true, firebase: jest.fn() };
const Base = new Schema({
  codec,
  defaultData,
  collection,
  dependencies,
  staticMethods: {
    simple: ctx => (...args) => {
      mock(ctx, ...args);
    },
    withArgs: () => (custom: string) => {
      mock(custom);
    },
    withReturnValue: () => (ret: boolean) => {
      return ret;
    },
  },
});

describe('constructor', () => {
  it("doesn't allow identical collections to be registered", () => {
    expect(() => new Schema({ codec, collection, defaultData })).toThrowError();
  });
  it('provides itself to the created models', () => {
    const m = Base.create(realData);
    expect(m.schema).toBe(Base);
  });
  it('creates models with correct params', () => {
    const base = Base.create(realData);
    const timestamp = admin.firestore.Timestamp.now(); // Works because of mocks
    expect(base.data.createdAt).toBe(timestamp);
    expect(base.data.updatedAt).toBe(timestamp);
    expect(base.data.schemaVersion).toBe(base.schema.version);
    jest.doMock('firebase-admin');
  });

  it('works with snapshots', () => {
    snapData.data.mockReturnValueOnce(realData);
    const m = Base.fromSnap(Cast(snapData));
    expect(m.snap).toBe(snapData);
    expect(m.data).toEqual(expect.objectContaining(realData));
  });
  it('enables simple staticMethods', () => {
    Base.methods.simple();
    expect(mock).toHaveBeenCalledWith(Base);
  });
  it('enables custom args to staticMethods', () => {
    Base.methods.withArgs('arg');
    expect(mock).toHaveBeenCalledWith('arg');
  });
  it('enables return values from staticMethods', () => {
    Base.methods.withArgs('arg');
    expect(Base.methods.withReturnValue(true)).toBe(true);
    expect(Base.methods.withReturnValue(false)).toBe(false);
  });
  it('provides an accessor for collection reference', () => {
    expect(Base.ref).toEqual(collectionRef);
  });
  it('creates a model from a doc reference', () => {
    const m = Base.fromDoc(Cast(docData));
    expect(m).toBeInstanceOf(Model);
    expect(m.id).toBe(docData.id);
    expect(m.doc).toBe(docData);
  });
  it('can delete models', async () => {
    const m = Base.deleteById('id');
    const transaction = { delete: jest.fn() };
    runTransaction.mockImplementation(cb => {
      return cb(transaction);
    });
    await m.run();
    expect(transaction.delete).toHaveBeenCalledWith(docData);
  });
  it('allows building a query', () => {
    const clauses = Cast([['set1', '==', 'check1']]);
    expect(Base.findWhere(clauses)).toBeInstanceOf(Query);
    expect(() => Base.findWhere([])).toThrowErrorMatchingInlineSnapshot(
      `"Must pass through query params"`,
    );
  });

  it('support validation of data', () => {
    const m = Base.create(realData);
    expect(Base.validate({})).toBeInstanceOf(SkeemaValidationError);
    expect(Base.validate(m)).toBeUndefined();
    expect(Base.validate(realData)).toBeUndefined();
    expect(Base.validate('failing string')!.message).toMatchInlineSnapshot(
      `"Your validation was called with invalid data was that was not an object. Please check that you are passing through either an object or a valid model instance"`,
    );
  });
});

test('getInstance', () => {
  expect(() => Schema.getInstance('alt')).toThrowError();
  expect(() => Schema.getInstance(collection)).not.toThrowError();
  // tslint:disable-next-line:no-unused-expression
  new Schema({ codec, collection: 'alt', defaultData });
  expect(() => Schema.getInstance('alt')).not.toThrowError();
});

test('setDefaultConfig', () => {
  const oldConfig = Cast(Schema).defaultConfig;
  const newConfig = { ...oldConfig, mirror: false, useTransactions: false };
  expect(Base.config).toEqual(oldConfig);
  Schema.setDefaultConfig(newConfig);
  const configTest = new Schema({
    codec,
    collection: testCollection('configTest'),
    defaultData,
  });
  expect(configTest.config).toEqual(newConfig);
  const altConfigTest = new Schema({
    codec,
    collection: testCollection('altConfigTest'),
    defaultData,
    config: { maxAttempts: 2 },
  });
  expect(altConfigTest.config).toEqual({ ...newConfig, maxAttempts: 2 });
  Schema.setDefaultConfig(oldConfig);
});
