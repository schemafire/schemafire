import { baseDefinitionObject, createDefaultBase } from '@skeema/core';
import {
  collectionRef,
  docData,
  runTransaction,
  snapData,
} from '@skeema/jest-mocks/lib/firebase-admin';
import { Any } from '@unit-test-helpers';
import * as t from 'io-ts';
import { Model } from '../model';
import { Query } from '../query';
import { Schema } from '../schema';

const definition = t.interface({
  name: t.string,
  age: t.number,
  data: t.object,
  ...baseDefinitionObject,
});

const defaultData = { name: '', data: {}, age: 20, ...createDefaultBase() };
const realData = {
  ...defaultData,
  name: 'Real',
  data: { real: 'stuff' },
  age: 32,
  custom: 'realness',
};

const collection = `test/123/base`;
const mock = jest.fn();

const dependencies = { initialized: true, firebase: jest.fn() };
const Base = new Schema({
  fields: definition,
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
    expect(() => new Schema({ fields: definition, collection, defaultData })).toThrowError();
  });
  it('provides itself to the created models', () => {
    const m = Base.create(realData);
    expect(m.schema).toBe(Base);
  });
  it('creates models with correct params', () => {
    const base = Base.create(realData);
    expect(base.data.createdAt).toBeTruthy();
    expect(base.data.schemaVersion).toEqual(expect.any(Number));
  });
  it('works with snapshots', () => {
    snapData.data.mockReturnValueOnce(realData);
    const m = Base.fromSnap(Any(snapData));
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
    const m = Base.fromDoc(Any(docData));
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
    const clauses = Any([['set1', '==', 'check1']]);
    expect(Base.findWhere(clauses)).toBeInstanceOf(Query);
    expect(() => Base.findWhere([])).toThrowErrorMatchingInlineSnapshot(
      `"Must pass through query params"`,
    );
  });
});

test('getInstance', () => {
  expect(() => Schema.getInstance('alt')).toThrowError();
  expect(() => Schema.getInstance(collection)).not.toThrowError();
  // tslint:disable-next-line:no-unused-expression
  new Schema({ fields: definition, collection: 'alt', defaultData });
  expect(() => Schema.getInstance('alt')).not.toThrowError();
});

test('setDefaultConfig', () => {
  const oldConfig = Any(Schema).defaultConfig;
  const newConfig = { mirror: false, useTransactions: false };
  expect(Base.config).toEqual(oldConfig);
  Schema.setDefaultConfig(newConfig);
  const configTest = new Schema({
    fields: definition,
    collection: 'configTest',
    defaultData,
  });
  expect(configTest.config).toEqual(newConfig);
  const altConfigTest = new Schema({
    fields: definition,
    collection: 'altConfigTest',
    defaultData,
    config: { maxAttempts: 2 },
  });
  expect(altConfigTest.config).toEqual({ ...newConfig, maxAttempts: 2 });
  Schema.setDefaultConfig(oldConfig);
});
