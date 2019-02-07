import { initializeLiveFirebase, testCollection } from '@live-test-helpers';
import { generateId } from '@schemafire/core';
import admin from 'firebase-admin';
import * as t from 'io-ts';
import { pick } from 'lodash/fp';
import { codec, defaultData, realData } from '../__fixtures__/shared.fixtures';
import { Schema } from '../schema';
import { AnyModel, ModelTypeOfSchema, TypeOfData } from '../types';
import { getDocument } from '../utils';

jest.unmock('firebase-admin');

initializeLiveFirebase();

const checkableData = pick(['name', 'data', 'age'], realData);

const collection = testCollection('base');

const simple = jest.fn();
const dependencies = { initialized: true, firebase: jest.fn() };
const Base = new Schema({
  codec,
  defaultData,
  collection,
  instanceMethods: { simple },
  dependencies,
});

describe('#create', () => {
  const ids: string[] = [generateId()];
  afterAll(async () => {
    const modelsToDelete: AnyModel[] = [];
    ids.forEach(id => modelsToDelete.push(Base.deleteById(id)));
    await Promise.all(modelsToDelete);
  });
  it('should create a document', async () => {
    const m = Base.create(realData, ids[0]);
    await m.run({ forceGet: true });
    expect(m.data).toEqual(expect.objectContaining(checkableData));
    expect(m.data).toHaveProperty('createdAt');
    expect(m.data).toHaveProperty('updatedAt');
    expect(m.data.updatedAt.isEqual(m.data.createdAt)).toBe(true);
  });

  it('should override a previously created document', async () => {
    const m = Base.create(realData);
    ids.push(m.id);
    const m2 = Base.create({ ...realData, age: 100 }, m.id);
    await m.run();
    const record = await getDocument<TypeOfData<typeof Base>>(m.id, collection);
    await m2.run();
    const record2 = await getDocument<TypeOfData<typeof Base>>(m.id, collection);
    expect(record2.data).not.toEqual(record.data);
    expect(record2.data!.createdAt.isEqual(record.data!.createdAt)).toBe(false);
  });
});

describe('#findOrCreate', () => {
  const id: string = generateId();
  afterEach(async () => {
    await Base.deleteById(id);
  });
  it('should create a document', async () => {
    await Base.findOrCreate(id, realData).run();
    const record = await getDocument<TypeOfData<typeof Base>>(id, collection);
    expect(record.data).toEqual(
      expect.objectContaining({
        name: 'Real',
      }),
    );
  });
  it('should not recreate a created document', async () => {
    const testId = generateId();
    const m = Base.findOrCreate(testId, realData);
    const m2 = Base.findOrCreate(testId, { ...realData, age: 100 });
    await m.run({ forceGet: true });
    await m2.run({ forceGet: true });
    expect(m2.data!.createdAt.isEqual(m.data!.createdAt)).toBe(true);
  });
});

describe('#deleteById', () => {
  const id: string = generateId();
  let model: ModelTypeOfSchema<typeof Base>;
  beforeEach(async () => {
    model = Base.create(realData, id);
    await model.run();
  });
  it('deletes data', async () => {
    const m = await Base.deleteById(id);
    await m.run();
    const record = await getDocument<TypeOfData<typeof Base>>(id, collection);
    expect(m.data).toEqual({});
    expect(m.exists).toBeFalse();
    expect(record.snap.exists).toBe(false);
  });
  it('ignores all other actions', async () => {
    const m = Base.deleteById(id);
    m.create(realData);
    m.data.age = 100;
    await m.run();
    const record = await getDocument<TypeOfData<typeof Base>>(id, collection);
    expect(m.data).toEqual({});
    expect(record.snap.exists).toBe(false);
  });
});

describe('#fromSnap', () => {
  const updateData = { age: 100, data: { rad: true } };
  let snap: FirebaseFirestore.DocumentSnapshot;
  let model: ReturnType<typeof Base['create']>;
  const id: string = generateId();
  beforeEach(async () => {
    snap = await admin
      .firestore()
      .collection(collection)
      .doc(id)
      .get();
    model = Base.fromSnap(snap);
  });

  afterEach(async () => {
    await Base.deleteById(id).run();
  });

  it('can update from snap', async () => {
    await model.update(updateData).run();
    expect(model.snap).toBeTruthy();
    const record = await getDocument<t.TypeOf<typeof codec>>(id, collection);
    expect(record.data).toEqual(expect.objectContaining(updateData));
  });

  it('can delete from snap', async () => {
    await model
      .create(realData)
      .delete(['custom'])
      .run();
    const record = await getDocument<t.TypeOf<typeof codec>>(id, collection);
    expect(record.data).not.toHaveProperty('custom');
  });
});

describe('#findById', () => {
  const id: string = generateId();
  beforeEach(async () => {
    await Base.create(realData, id).run();
  });

  afterEach(async () => {
    await Base.deleteById(id).run();
  });

  it('can find via id', async () => {
    const model = Base.findById(id);
    expect(model.data).not.toEqual(expect.objectContaining(checkableData));
    await model.run();
    expect(model.data).toEqual(expect.objectContaining(checkableData));
  });
  it('can find via callback', async () => {
    await Base.findById(id, params => {
      expect(params.exists).toBe(true);
      expect(params.model.data).toEqual(expect.objectContaining(checkableData));
    }).run();
    expect.assertions(2);
  });
  it('can update and delete from within the find method', async () => {
    const newData = { age: 99 };
    await Base.findById(id, ({ model }) => {
      model.update(newData);
      model.delete(['name']);
    }).run();
    const record = await getDocument<t.TypeOf<typeof codec>>(id, collection);
    expect(record.data).toEqual(expect.objectContaining(newData));
    expect(record.data).not.toHaveProperty('name');
  });
});
