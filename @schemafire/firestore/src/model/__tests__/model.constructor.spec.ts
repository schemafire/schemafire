import { Cast } from '@schemafire/core';
import { doc, docData } from '@schemafire/jest-mocks/lib/firebase-admin';
import { defaultData, mock, schema, simpleSchema } from '../../__fixtures__/shared.fixtures';
import { omitBaseFields } from '../../base';
import { Model } from '../model';

describe('constructor', () => {
  const model = schema.model({ data: {} });
  it('can be created', () => {
    const m1 = new Model({ schema: simpleSchema, methods: Cast({}) });
    expect(m1.id).toBe(docData.id);
    expect(omitBaseFields(m1.data)).toEqual(defaultData);
    const m2 = new Model({ schema: simpleSchema, methods: Cast({}), id: 'abc' });
    expect(m2.id).toBe('abc');
    expect(doc).toHaveBeenCalledWith('abc');
  });
  it('protects data field', () => {
    const initialData = { ...model.data };
    delete model.data;
    expect(initialData).toEqual(model.data);
    expect(() => (Cast(model).data = undefined)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot set property data of #<Model> which has only a getter"`,
    );
  });
  it('calls simple methods', () => {
    model.methods.simple();
    expect(mock).toHaveBeenCalledWith(model, model.schema.dependencies);
  });
  it('calls methods with extra args', () => {
    model.methods.extraArg('simple');
    expect(mock).toHaveBeenCalledWith(model, model.schema.dependencies, 'simple');
  });
  it('calls methods with multiple extra args', () => {
    model.methods.extraArgs('simple', 1);
    expect(mock).toHaveBeenCalledWith(model, model.schema.dependencies, 'simple', 1);
  });
  it('provides a return value', () => {
    const ret = { simple: true };
    expect(model.methods.withReturnValue(ret)).toBe(ret);
  });
  it('preserves context', () => {
    const newContext = {
      update: model.update,
      create: model.create,
      delete: model.delete,
    };
    expect(() => newContext.update({ age: 100 })).not.toThrow();
    expect(() => newContext.create({ age: 100, custom: '', data: {}, name: '' })).not.toThrow();
    expect(() => newContext.delete(['name'])).not.toThrow();
  });
});
