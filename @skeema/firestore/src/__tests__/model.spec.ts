import { removeUndefined } from '@skeema/core';
import {
  collectionRef,
  doc,
  docData,
  get as docGetter,
  limit,
} from '@skeema/jest-mocks/lib/firebase-admin';
import { Any, typeSafeMockImplementation } from '@unit-test-helpers';
import admin from 'firebase-admin';

import {
  advancedSchema,
  defaultData,
  mock,
  mockTransaction,
  realData,
  schema,
  simpleSchema,
} from '../__fixtures__/shared.fixtures';
import { omitBaseFields } from '../base';
import { Model } from '../model';
import { ModelActionType, TypeOfModel } from '../types';

let mockRunTransaction: jest.Mock<{}>;

beforeEach(() => {
  mockRunTransaction = typeSafeMockImplementation(
    admin.firestore().runTransaction,
    (fn: (cb: typeof mockTransaction) => Promise<void>) => {
      // NOTE - this was a very difficult to identify bug that could only be fixed by returning the function call here. Find out why that is.
      return fn(mockTransaction);
    },
  );
});

describe('constructor', () => {
  const model = schema.model({ data: {} });
  schema.findById('').methods.simple();
  it('is created', () => {
    const m1 = new Model({ schema: simpleSchema, methods: Any({}) });
    expect(m1.id).toBe(docData.id);
    expect(omitBaseFields(m1.data)).toEqual(defaultData);
    const m2 = new Model({ schema: simpleSchema, methods: Any({}), id: 'abc' });
    expect(m2.id).toBe('abc');
    expect(doc).toHaveBeenCalledWith('abc');
  });
  it('protects data field', () => {
    const initialData = { ...model.data };
    delete model.data;
    expect(initialData).toEqual(model.data);
    expect(() => (Any(model).data = undefined)).toThrowErrorMatchingInlineSnapshot(
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

describe('data', () => {
  let model: TypeOfModel<typeof advancedSchema>;
  beforeEach(() => {
    model = advancedSchema.model({});
  });
  it('can only be set when property exists on definition', () => {
    model.data.age = 200;
    expect(model.data.age).toBe(200);
    expect(() => (Any(model.data).other = 100)).toThrowErrorMatchingInlineSnapshot(
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
    expect(() => delete Any(model.data).other).toThrowErrorMatchingInlineSnapshot(
      `"The property other does not exist on this model"`,
    );
    // @ts-ignore
    expect(() => delete model.data.createdAt).toThrowErrorMatchingInlineSnapshot(
      `"The property createdAt cannot be deleted"`,
    );
  });

  // Todo un-comment  this test after allowing customizable baseProps
  // it.skip('does not allow setting or deleting base props', () => {
  // });
});

describe('#update', () => {
  let model: TypeOfModel<typeof schema>;
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
  let model: TypeOfModel<typeof schema>;
  mockTransaction.get.mockResolvedValue({ exists: true, data: () => realData });
  beforeEach(() => {
    model = schema.model({ schema });
  });
  it('passed the correct arguments', async () => {
    const attachedMock = jest.fn();
    await model.attach(attachedMock).run();
    expect(attachedMock).toHaveBeenCalledWith({
      model,
      exists: true,
      data: realData,
      get: mockTransaction.get,
    });
  });
  it('preserves context', async () => {
    const attachedMock = jest.fn();
    const newContext = { attach: model.attach };
    expect(() => newContext.attach((...args) => attachedMock(...args))).not.toThrow();
  });
  it('updates the data', async () => {
    await model.attach(p => p.model.update({ name: 'new', age: 21 })).run();
    expect(model.data.name).toBe('new');
    expect(model.data.age).toBe(21);
  });
  it('deletes data', async () => {
    await model.attach(p => p.model.delete(['name'])).run();
    expect(model.data.name).toBeFalsy();
  });
  it('creates data', async () => {
    await model.attach(p => p.model.create(realData)).run();
    expect(model.data).toEqual(realData);
  });
  it('can be chained', async () => {
    await model
      .attach(p => p.model.delete(['name']))
      .attach(p => p.model.update({ age: 21 }))
      .run();
    expect(model.data).toEqual({ age: 21, data: { real: 'stuff' }, custom: 'realness' });
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
  let model: TypeOfModel<typeof schema>;
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
  let model: TypeOfModel<typeof schema>;
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

// If data is passed in at the beginning a create operation is added.
// When deciding what to do the model needs to check if there exists a create action.
// If there is a create action then this is a create operation.
// This is complicated by the fact that it's possible that the model can be part of a find or create.
// In the case when there's a find or create i can create a new action type called FindOrCreate which if found will pull data
// ONce an action is applied it is removed. This allows the models to be long-lived.
// The reason for an actions queue is to allow updates to only update the relevant field. If not then updates would push up all the default data and override stuff.
// Actions Delete | Update | Create | FindOrCreate
describe('#run', () => {
  let testModel: TypeOfModel<typeof schema>;
  const data = { age: 32 };
  beforeEach(() => {
    testModel = schema.model({ schema });
  });
  it('bails early when no actions are passed in', async () => {
    await testModel.run();
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
  it('preserves context of this', () => {
    const ctx = { run: testModel.run };
    expect.assertions(1);
    return ctx
      .run()
      .then(val => {
        expect(val).toBe(testModel);
      })
      .catch(e => {
        throw e;
      });
  });
  it('handles mirroring', async () => {
    const mm = schema.model({ data: realData, type: ModelActionType.Create });
    await mm.run();
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ user: realData }),
      { merge: true },
    );
  });

  describe('configuration', () => {
    it('accepts configuration for number of transaction attempts', async () => {
      const maxAttempts = 2;
      await testModel.update({ name: 'Number of attempts' }).run({ maxAttempts });
      expect(mockRunTransaction).toHaveBeenCalledWith(expect.anything(), { maxAttempts });
    });
    it('defaults to running a get request when `forceGet` is passed in ', async () => {
      await testModel.run({ forceGet: true });
      expect(mockTransaction.get).toHaveBeenCalled();
    });
    it('`forceGet` runs with delete and update actions', async () => {
      await testModel.delete(['age']).run({ forceGet: true });
      expect(mockTransaction.get).toHaveBeenCalledTimes(1);
      expect(testModel.data.age).toBeFalsy();
      await testModel.update({ age: 25 }).run({ forceGet: true });
      expect(mockTransaction.get).toHaveBeenCalledTimes(2);
      expect(testModel.data.age).toBe(25);
    });
    it("`forceGet` doesn't run when the whole model deleted", async () => {
      await testModel.delete().run({ forceGet: true });
      expect(mockTransaction.get).not.toHaveBeenCalled();
    });
    it('with forceGet it runs getSnap after a create', async () => {
      const createData = { ...realData, age: 101 };
      const expectedSnap = { exists: true, data: jest.fn(() => createData) };
      mockTransaction.set.mockImplementationOnce(() => {
        docGetter.mockResolvedValueOnce(expectedSnap);
      });
      const mm = schema.create(createData);
      const initialSnap = mm.snap;
      await mm.run({ forceGet: true });
      expect(initialSnap).not.toEqual(mm.snap);
      expect(mm.snap).toEqual(expectedSnap);
      expect(mm.snap!.data()).toEqual(expectedSnap.data());
      expect(mockTransaction.get).not.toHaveBeenCalled();
      expect(mm.data).toEqual(expect.objectContaining(createData));
    });

    // it.skip('enables running outside of a transaction', async () => {
    //   await testModel.update({ age: 100 }).run({ useTransactions: false });
    //   expect(mockRunTransaction).not.toHaveBeenCalled();
    // });

    it('can be run without mirroring', async () => {
      const mm = schema.model({ data: realData, type: ModelActionType.Create });
      await mm.run({ mirror: false });
      expect(mockTransaction.set).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ user: realData }),
        expect.anything(),
      );
    });
  });

  it('handles Create', async () => {
    const mm = schema.model({ data: realData, type: ModelActionType.Create });
    await mm.run();
    expect(mockTransaction.set).toHaveBeenCalledWith(
      mm.doc,
      expect.objectContaining(removeUndefined(realData)),
    );
    expect(mm.exists).toBeTrue();
  });
  it('handles FindOrCreate', async () => {
    mockTransaction.set.mockClear();
    mockTransaction.get.mockResolvedValueOnce({ exists: false, data: jest.fn() });
    const mm = await schema
      .model({
        schema,
        data: realData,
        type: ModelActionType.FindOrCreate,
      })
      .run();

    // Ignore the mirroring
    expect(mockTransaction.set).not.toHaveBeenCalledWith(
      mm.doc,
      expect.objectContaining({ realData }),
      { merge: true },
    );
    expect(mockTransaction.get).toHaveBeenCalled();
    expect(mockTransaction.create).toHaveBeenCalledWith(
      mm.doc,
      expect.objectContaining(removeUndefined(realData)),
    );
    expect(mm.exists).toBeTrue();

    mockTransaction.create.mockClear();
    await schema.findOrCreate('iod', realData).run();
    expect(mockTransaction.get).toHaveBeenCalledTimes(2);
    expect(mockTransaction.create).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalledWith();
  });
  it('handles updates within findOrCreate', async () => {
    mockTransaction.get.mockResolvedValueOnce({
      exists: true,
      data: jest.fn(() => realData),
    });
    const mm = await schema
      .findOrCreate('any-id', realData, ({ model }) => {
        model.update({ age: 200 });
      })
      .run();

    expect(mm.data.age).toBe(200);
    expect(mockTransaction.set).toHaveBeenCalledWith(
      mm.doc,
      expect.objectContaining(removeUndefined({ ...realData, age: 200 })),
      { merge: true },
    );
  });

  it('handles Delete', async () => {
    const mm = schema.model({ data: realData, type: ModelActionType.Delete });
    await mm.run();
    expect(mockTransaction.delete).toHaveBeenCalledWith(mm.doc);
    expect(mm.exists).toBeFalse();
    expect(mm.data).toBeEmpty();
  });
  it('handles Find', async () => {
    const mm = schema.model({ data: realData, type: ModelActionType.Find });
    await mm.run();
    expect(mockTransaction.get).toHaveBeenCalledWith(mm.doc);
  });
  it('does not call update after Find', async () => {
    const mm = schema.model({ data: realData, type: ModelActionType.Find });
    await mm.run();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('does not call update after Find with callback but no actions', async () => {
    const mm = schema.model({ data: realData, type: ModelActionType.Find }).attach(jest.fn());
    await mm.run();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('handles Find with a callback containing a force create', async () => {
    const mm = await schema.model({ type: ModelActionType.Find }).attach(({ model }) => {
      model.create(realData);
    });
    await mm.run();
    expect(mm.data.age).toBe(realData.age);
    expect(mockTransaction.set).toHaveBeenCalledWith(
      mm.doc,
      expect.objectContaining({ age: realData.age }),
    );
  });
  it('handles Find with a callback containing a non-forced create', async () => {
    mockTransaction.get.mockResolvedValueOnce({ exists: false, data: jest.fn() });
    const mm = schema.model({ type: ModelActionType.Find }).attach(({ model }) => {
      model.create(realData, false);
    });
    await mm.run();
    expect(mm.data.age).toBe(realData.age);
    expect(mockTransaction.create).toHaveBeenCalledWith(
      mm.doc,
      expect.objectContaining({ age: realData.age }),
    );
  });
  it('handles Query', async () => {
    mockTransaction.get.mockResolvedValueOnce({
      size: 1,
      docs: [{ exists: true, data: jest.fn(), ref: docData }],
    });
    limit.mockReturnValueOnce(collectionRef);
    const mm = schema.model({
      clauses: [['age', '==', 100]],
      type: ModelActionType.Query,
    });
    await mm.run();
    expect(mockTransaction.get).toHaveBeenCalledWith(collectionRef);
    expect(limit).toHaveBeenCalledWith(1);
    expect(mm.exists).toBe(true);
    mockTransaction.get.mockResolvedValueOnce({ size: 0, docs: [] });
    await schema.find([['age', '==', 'check1']]).run();
    expect(mockTransaction.get).toHaveBeenCalledTimes(2);
  });
  it('throws when no query clauses provided', () => {
    expect(() => schema.model({ type: ModelActionType.Query })).toThrowErrorMatchingInlineSnapshot(
      `"Type 'Query' can only be defined with clauses"`,
    );
  });
  it('only runs transaction.get() once', async () => {
    mockTransaction.get.mockResolvedValueOnce({
      size: 1,
      docs: [{ exists: true, data: jest.fn(), ref: docData }],
    });
    limit.mockReturnValueOnce(collectionRef);
    const mm = schema
      .model({
        data: realData,
        type: ModelActionType.Query,
        clauses: [['age', '==', 100]],
      })
      .attach(({ model }) => {
        model.update({});
      });
    await mm.run();
    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
  });
  it('throws when no data is passed in with creation type', async () => {
    expect(() => schema.model({ type: ModelActionType.Create })).toThrowErrorMatchingInlineSnapshot(
      `"Type 'Create' can only be defined with data"`,
    );
    expect(() =>
      schema.model({ type: ModelActionType.FindOrCreate }),
    ).toThrowErrorMatchingInlineSnapshot(`"Type 'FindOrCreate' can only be defined with data"`);
    expect(() => schema.model({ type: ModelActionType.Delete })).not.toThrowError();
  });
  it('resets the updates when successful', async () => {
    await testModel
      .update(data)
      .delete(['custom'])
      .run();
    await testModel.run();
    await testModel.run();
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });
  it('allows replay when the internal update transaction fails', async () => {
    mockRunTransaction.mockRejectedValueOnce(new Error('Test'));
    await expect(testModel.update(data).run()).rejects.toThrowErrorMatchingInlineSnapshot(`"Test"`);
    await testModel.run();
    expect(mockTransaction.set).toHaveBeenCalledWith(testModel.doc, expect.objectContaining(data), {
      merge: true,
    });
  });
});
