import { testCollection } from '@live-test-helpers';
import { Cast, numbers, strings, utils } from '@schemafire/core';
import { docData, firestore } from '@schemafire/jest-mocks/lib/firebase-admin';
import { typeSafeMockImplementation, typeSafeMockReturn } from '@unit-test-helpers';
import admin from 'firebase-admin';
import * as t from 'io-ts';
import {
  advancedSchema,
  defaultData,
  mockTransaction,
  realData,
  schema,
  simpleSchema,
} from '../../__fixtures__/shared.fixtures';
import { ValidationError } from '../../errors';
import { Schema } from '../../schema';
import { ModelTypeOfSchema } from '../../types';

beforeEach(() => {
  typeSafeMockImplementation(
    admin.firestore().runTransaction,
    (fn: (cb: typeof mockTransaction) => Promise<void>) => {
      // ? This was a very difficult to identify bug that could only be fixed by returning the function call here.
      // ? Find out why that is.
      return fn(mockTransaction);
    },
  );
});

describe('data', () => {
  let model: ModelTypeOfSchema<typeof advancedSchema>;
  beforeEach(() => {
    model = advancedSchema.model({});
  });
  it('can only be set when property exists on definition', () => {
    model.data.age = 200;
    expect(model.data.age).toBe(200);
    expect(() => (Cast(model.data).other = 100)).toThrowErrorMatchingInlineSnapshot(
      `"The property other does not exist on [object Object]"`,
    );
    expect(
      // @ts-ignore
      () => (model.data.createdAt = admin.firestore.Timestamp.now()),
    ).toThrowErrorMatchingInlineSnapshot(`"The property createdAt is readonly and cannot be set"`);
  });
  it('removes data when deleted for valid fields', () => {
    delete model.data.age;
    expect(model.data.age).toBeUndefined();
    expect(() => delete Cast(model.data).other).toThrowErrorMatchingInlineSnapshot(
      `"The property other does not exist on this model"`,
    );
    // @ts-ignore
    expect(() => delete model.data.createdAt).toThrowErrorMatchingInlineSnapshot(
      `"The property createdAt cannot be deleted"`,
    );
  });

  it.todo('does not allow setting or deleting base props');
});

describe('#update', () => {
  let model: ModelTypeOfSchema<typeof schema>;
  beforeEach(() => {
    model = schema.model({ data: {} });
  });
  it('updates individual properties', () => {
    const newData = { test: 'test' };
    model.data.data = newData;
    expect(model.data.data).toBe(newData);
  });
  it('can update multiple properties', () => {
    model.update({ name: 'new', age: 21 });
    expect(model.data.name).toBe('new');
    expect(model.data.age).toBe(21);
  });
});

// Add a callback which is run after getting the latest data
describe('#attach', () => {
  let model: ModelTypeOfSchema<typeof schema>;
  mockTransaction.get.mockResolvedValue({ exists: true, data: () => realData });
  beforeEach(() => {
    model = schema.model({ schema });
  });
  it('receives the correct parameter object', async () => {
    const attachedMock = jest.fn();
    await model.attach(attachedMock).run();
    expect(mockTransaction.get).toHaveBeenCalled();
    expect(attachedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        exists: true,
        data: realData,
        delete: expect.any(Function),
        update: expect.any(Function),
        create: expect.any(Function),
        doc: expect.anything(),
      }),
    );
  });
  it('preserves context', async () => {
    const attachedMock = jest.fn();
    const newContext = { attach: model.attach };
    expect(() => newContext.attach((...args) => attachedMock(...args))).not.toThrow();
  });
  it('updates the data', async () => {
    await model.attach(p => p.update({ name: 'new', age: 21 })).run();
    expect(model.data.name).toBe('new');
    expect(model.data.age).toBe(21);
  });
  it('deletes data', async () => {
    await model.attach(p => p.delete(['name'])).run();
    expect(model.data.name).toBeFalsy();
  });
  it('creates data', async () => {
    await model.attach(p => p.create(realData)).run();
    expect(model.data).toEqual(realData);
  });
  it('can be chained', async () => {
    const original = firestore.FieldValue.delete();
    typeSafeMockReturn(firestore.FieldValue.delete, undefined);
    await model
      .attach(p => p.delete(['name']))
      .attach(p => p.update({ age: 21 }))
      .run();
    expect(model.data).toEqual({ age: 21, data: { real: 'stuff' }, custom: 'realness' });
    typeSafeMockReturn(firestore.FieldValue.delete, original);
  });
  it('is not called if delete has already been called', async () => {
    const attachedMock = jest.fn();
    await model
      .delete()
      .attach(attachedMock)
      .run();
    expect(attachedMock).not.toHaveBeenCalled();
  });
  it('is called even when update called', async () => {
    const attachedMock = jest.fn();
    await model
      .update(realData)
      .attach(attachedMock)
      .run();
    expect(attachedMock).toHaveBeenCalled();
  });
});

describe('#create', () => {
  let model: ModelTypeOfSchema<typeof schema>;
  beforeEach(() => {
    model = schema.model({ schema });
    model.create({ name: 'Raj', data: { custom: 'data' }, age: 21, custom: 'custom' });
  });
  const newData = { name: 'Raj', data: { custom: 'data' }, age: 21, custom: 'custom' };
  it('keeps the data in sync with proxy', () => {
    expect(model.data).toEqual(newData);
  });
  it('call the correct transaction method', async () => {
    await model.run();
    expect(mockTransaction.set).toHaveBeenCalledWith(model.doc, expect.objectContaining(newData));
  });
});

describe('#delete', () => {
  let model: ModelTypeOfSchema<typeof schema>;
  beforeEach(() => {
    model = schema.model({ schema });
  });

  it('can delete properties directly', async () => {
    delete model.data.age;
    expect(model.data.age).toEqual(undefined);
    await model.run();
    expect(mockTransaction.set).toHaveBeenCalledWith(
      model.doc,
      expect.objectContaining({ age: admin.firestore.FieldValue.delete() }),
      { merge: true },
    );
  });
  it('directly deletes properties', async () => {
    await model.delete(['age']).run();
    expect(model.data.age).toEqual(undefined);
    expect(mockTransaction.set).toHaveBeenCalledWith(
      model.doc,
      expect.objectContaining({ age: admin.firestore.FieldValue.delete() }),
      { merge: true },
    );
  });
  it('ignores other actions when delete is called', async () => {
    const mm = simpleSchema.model({});
    await mm
      .update({ custom: 'not custom' })
      .create({ ...defaultData, age: 100 })
      .delete()
      .run();
    expect(mm.data).toEqual({});
    expect(mockTransaction.set).not.toHaveBeenCalled();
    expect(mockTransaction.delete).toHaveBeenCalledWith(mm.doc);
  });
  it('mirrors the delete to the mirrored document', async () => {
    await model.delete().run();
    expect(mockTransaction.set).toHaveBeenCalledWith(
      docData,
      expect.objectContaining({ user: admin.firestore.FieldValue.delete() }),
      { merge: true },
    );
  });
});

describe('#validate', () => {
  const validationCodec = t.interface({
    username: strings.username({ minimum: 5, maximum: 10 }),
    age: t.intersection([numbers.gte(18), numbers.lte(25)]),
    me: utils.optional(
      t.interface({
        name: t.string,
      }),
    ),
  });
  const validData = { username: 'greatest', age: 25, me: { name: 'Tester' } };
  const validSchema = new Schema({
    codec: validationCodec,
    defaultData: { username: 'abcde', age: 20, me: undefined },
    collection: testCollection('valid'),
  });

  const invalidSchema = new Schema({
    codec: validationCodec,
    defaultData: { username: 'a', age: 50, me: undefined },
    collection: testCollection('invalid'),
  });

  let validModel: ModelTypeOfSchema<typeof validSchema>;
  let invalidModel: ModelTypeOfSchema<typeof validSchema>;

  beforeEach(() => {
    validModel = validSchema.model();
    invalidModel = invalidSchema.model();
  });
  it('is valid when no actions taken and default data is valid', () => {
    expect(validModel.validate()).toBeUndefined();
  });

  it('is invalid when no actions taken and default data is invalid', () => {
    const expectedError = invalidModel.validate();
    expect(expectedError).toBeInstanceOf(ValidationError);
    expect(expectedError!.messages[0]).toMatchInlineSnapshot(
      `"Invalid value \\"a\\" supplied to username: \`(min(5) & max(10) & start.with.letter & letters.numbers.underscores)\`.0: \`min(5)\`"`,
    );
  });

  it('only returns an error when invalid data is pass in', () => {
    validModel.create({ age: 50, username: 'abc', me: undefined });
    const expectedError = validModel.validate();
    expect(expectedError).toBeInstanceOf(ValidationError);
    expect(expectedError!.errors).toContainAllKeys(['age', 'username']);
    expect(expectedError!.keys).toContainValues(['age', 'username']);
  });

  it('should successfully pass for partially valid updates', () => {
    invalidModel.update({ age: 21 });
    expect(invalidModel.validate()).toBeUndefined();
  });

  it('should automatically be called when creating or updating data', async () => {
    const validSpy = jest.spyOn(validModel, 'validate');
    const invalidSpy = jest.spyOn(invalidModel, 'validate');
    validModel.create(validData);
    await expect(validModel.run()).resolves.toEqual(validModel);
    expect(validSpy).toHaveBeenCalledTimes(1);

    invalidModel.create({ ...validData, age: 100 });
    await expect(invalidModel.run()).rejects.toThrowError(ValidationError);
    expect(invalidSpy).toHaveBeenCalledTimes(1);
  });

  it('should allow for configuration', async () => {
    const invalidSpy = jest.spyOn(invalidModel, 'validate');
    invalidModel.create({ ...validData, age: 100 });
    await expect(invalidModel.run({ autoValidate: false })).resolves.toEqual(invalidModel);
    expect(invalidSpy).not.toHaveBeenCalled();
  });
});
