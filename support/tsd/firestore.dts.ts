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

// @dts-jest:pass:snap
schema.methods.simple();

// @dts-jest:pass:snap
schema.methods.withReturnValue(true);

// @dts-jest:fail:snap
schema.methods.simple({});

// @dts-jest:fail:snap
schema.methods.extraArgs({}, 10);

// @dts-jest:pass:snap
schema.methods.extraArgs('', 10);

const model = schema.model();

// @dts-jest:pass:snap
model.methods.simple();

// @dts-jest:pass:snap
model.methods.withReturnValue(true);

// @dts-jest:fail:snap
model.methods.simple({});

// @dts-jest:fail:snap
model.methods.extraArgs({}, 10);

// @dts-jest:pass:snap
model.methods.extraArgs('', 10);

// @dts-jest:pass:snap
type A = keyof typeof model.methods;

model.attach(params => {
  params.update({ age: 1, custom: '', data: {}, name: '' });
  // @dts-jest:fail:snap
  params.data.createdAt = new Date();

  // @dts-jest:fail:snap
  params.data.updatedAt = new Date();

  // @dts-jest:fail:snap
  params.data.schemaVersion = new Date();
});
