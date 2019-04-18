import * as t from 'io-ts';
import { Schema } from '@schemafire/firestore';

const codec = t.interface({
  name: t.string,
  age: t.number,
  custom: t.string,
  data: t.UnknownRecord,
});

const defaultData = { name: '', data: {}, age: 20, custom: 'custom' };

const mock = (...args: any[]) => console.log(args);

const schema = new Schema({
  codec,
  defaultData,
  collection: 'standard',
  mirror: { collection: 'mirror', idField: 'custom', name: 'user' },
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
    withReturnValue: () => (ret: boolean) => {
      return ret;
    },
  },
  staticMethods: {
    extraArg: ctx => (extra: string) => {
      mock(ctx, extra);
    },
    extraArgs: ctx => (extra: string, num: number) => {
      mock(ctx, extra, num);
    },
    simple: ctx => () => {
      mock(ctx);
    },
    withReturnValue: _ => (ret: boolean) => {
      return ret;
    },
  },
});

// -$ExpectType void
schema.methods.simple();

// -$ExpectType boolean
schema.methods.withReturnValue(true);

// $ExpectError
schema.methods.simple({});

// $ExpectError
schema.methods.extraArgs({}, 10);

// -$ExpectType void
schema.methods.extraArgs('', 10);

const model = schema.model();

// -$ExpectType void
model.methods.simple();

// -$ExpectType boolean
model.methods.withReturnValue(true);

// $ExpectError
model.methods.simple({});

// $ExpectError
model.methods.extraArgs({}, 10);

// -$ExpectType void
model.methods.extraArgs('', 10);

// -$ExpectType "extraArg" | "extraArgs" | "simple" | "withReturnValue"
type A = keyof typeof model.methods;

model.attach(params => {
  params.update({ age: 1, custom: '', data: {}, name: '' });
  params.data.createdAt = new Date(); // $ExpectError
  params.data.updatedAt = new Date(); // $ExpectError
  params.data.schemaVersion = new Date(); // $ExpectError
});
