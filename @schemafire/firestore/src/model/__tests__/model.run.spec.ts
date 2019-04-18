import { Cast, removeUndefined } from '@schemafire/core';
import { collectionRef, docData, get as docGetter, limit } from '@schemafire/jest-mocks/lib/firebase-admin';
import { typeSafeMockImplementation } from '@unit-test-helpers';
import admin from 'firebase-admin';
import retry from 'p-retry';
import { mockTransaction, realData, schema } from '../../__fixtures__/shared.fixtures';
import { ModelActionType, ModelTypeOfSchema } from '../../types';

describe('#run', () => {
  let mockRunTransaction: jest.Mock<{}>;
  let testModel: ModelTypeOfSchema<typeof schema>;
  const data = { age: 32 };

  beforeEach(() => {
    jest.useFakeTimers();
    mockRunTransaction = typeSafeMockImplementation(
      admin.firestore().runTransaction,
      (fn: (cb: typeof mockTransaction) => Promise<void>, { maxAttempts = 5 }: { maxAttempts: number }) => {
        // ? This was a very difficult to identify bug that could only be fixed by returning the function call here.
        // ? Find out why that is.
        return retry(() => fn(mockTransaction), {
          retries: maxAttempts /* maxTimeout: 1000, minTimeout: 1 */,
        });
      },
    );

    testModel = schema.model({ schema });
    mockTransaction.get.mockResolvedValue({ exists: true, data: () => realData });
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
        docGetter.mockResolvedValueOnce(Cast(expectedSnap));
      });

      const mm = schema.create({ data: createData });
      const initialSnap = mm.snap;
      await mm.run({ forceGet: true });
      expect(initialSnap).not.toEqual(mm.snap);
      expect(mm.snap).toEqual(expectedSnap);
      expect(mm.snap!.data()).toEqual(expectedSnap.data());
      expect(mockTransaction.get).not.toHaveBeenCalled();
      expect(mm.data).toEqual(expect.objectContaining(createData));
    });

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

  describe('FindOrCreate', () => {
    it('creates data when none is found', async () => {
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
      expect(mockTransaction.set).not.toHaveBeenCalledWith(mm.doc, expect.objectContaining({ realData }), {
        merge: true,
      });

      expect(mockTransaction.get).toHaveBeenCalledTimes(1);
      expect(mockTransaction.create).toHaveBeenCalledWith(
        mm.doc,
        expect.objectContaining(removeUndefined(realData)),
      );
      expect(mm.exists).toBeTrue();
    });

    it('does not create data when found', async () => {
      mockTransaction.get.mockResolvedValueOnce({ exists: true, data: () => realData });
      await schema.findOrCreate({ id: 'iod', data: realData }).run();
      expect(mockTransaction.get).toHaveBeenCalledTimes(1);
      expect(mockTransaction.create).not.toHaveBeenCalled();
      expect(mockTransaction.set).not.toHaveBeenCalledWith();
    });

    it('can be updated', async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        data: jest.fn(() => realData),
      });

      const mm = await schema
        .findOrCreate({
          id: 'any-id',
          data: realData,
          callback: ({ update }) => {
            update({ age: 200 });
          },
        })
        .run();
      expect(mm.data.age).toBe(200);
      expect(mockTransaction.set).toHaveBeenCalledWith(
        mm.doc,
        expect.objectContaining(removeUndefined({ ...realData, age: 200 })),
        { merge: true },
      );
    });
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
    const mm = await schema.model({ type: ModelActionType.Find }).attach(({ create }) => {
      create(realData);
    });

    await mm.run();
    expect(mm.data.age).toBe(realData.age);
    expect(mockTransaction.set).toHaveBeenCalledWith(mm.doc, expect.objectContaining({ age: realData.age }));
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
      `"Type 'Query' must be defined with clauses"`,
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
      .attach(({ update }) => {
        update({});
      });

    await mm.run();
    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
  });

  it('throws when no data is passed in with creation type', async () => {
    expect(() => schema.model({ type: ModelActionType.Create })).toThrowErrorMatchingInlineSnapshot(
      `"The creation type 'Create' must define data"`,
    );
    expect(() => schema.model({ type: ModelActionType.FindOrCreate })).toThrowErrorMatchingInlineSnapshot(
      `"The creation type 'FindOrCreate' must define data"`,
    );
    expect(() => schema.model({ type: ModelActionType.Delete })).not.toThrowError();
  });

  it('resets the updates when successful', async () => {
    await testModel.update(data).run();
    await testModel.run();
    await testModel.run();
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it('can be rerun after an error occurs', async () => {
    mockRunTransaction.mockRejectedValueOnce(Cast(new Error('Test')));
    await expect(testModel.update(data).run()).rejects.toThrowErrorMatchingInlineSnapshot(`"Test"`);
    expect(mockTransaction.set).not.toHaveBeenCalled();
    await testModel.run();
    expect(mockTransaction.set).toHaveBeenCalledWith(testModel.doc, expect.objectContaining(data), {
      merge: true,
    });
  });
});
