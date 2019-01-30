import { testCollection } from '@live-test-helpers';
import * as t from 'io-ts';
import { Schema } from '../schema';

export const mockTransaction = {
  delete: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
};

export const codec = t.interface({
  name: t.string,
  age: t.number,
  custom: t.string,
  data: t.object,
});
export const defaultData = { name: '', data: {}, age: 20, custom: 'custom' };
export const realData = {
  name: 'Real',
  data: { real: 'stuff' },
  age: 32,
  custom: 'realness',
};
export const mock = jest.fn();
export const schema = new Schema({
  codec,
  defaultData,
  collection: testCollection('standard'),
  mirror: { collection: testCollection('mirror'), idField: 'custom', name: 'user' },
  instanceMethods: {
    extraArg: (model, deps) => (extra: string) => {
      mock(model, deps, extra);
    },
    extraArgs: (model, deps) => (extra: string, num: number) => {
      mock(model, deps, extra, num);
    },
    simple: (model, deps) => () => {
      mock(model, deps);
    },
    withReturnValue: () => (ret: object) => {
      return ret;
    },
  },
});
export const simpleSchema = new Schema({
  codec,
  defaultData,
  collection: testCollection('simple'),
});

export const advancedDefinition = t.interface({
  name: t.string,
  age: t.number,
  custom: t.string,
  data: t.object,
});

export const advancedDefaultData = {
  ...defaultData,
};

export const advancedRealData = {
  ...realData,
};

export const advancedSchema = new Schema({
  codec: advancedDefinition,
  defaultData: advancedDefaultData,
  collection: testCollection('advanced'),
  mirror: { collection: testCollection('mirror'), idField: 'custom', name: 'user' },
  instanceMethods: {
    world: (model, deps) => (extra: string, num: number) => {
      mock(model, deps, extra, num);
    },
  },
  staticMethods: {
    hello: () => () => {
      return 'hello';
    },
  },
});
