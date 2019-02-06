import { Cast } from '@schemafire/core';
import {
  buildQuery,
  safeFirestoreCreate,
  safeFirestoreCreateUpdate,
  safeFirestoreUpdate,
  serverCreateTimestamp,
  serverCreateUpdateTimestamp,
  serverUpdateTimestamp,
} from '../utils';

test('buildQuery', () => {
  const sets = [['set1', '==', 'check1'], ['set2', '==', 'check2'], ['set3', '==', 'check3']];
  const ref = { where: jest.fn() };
  buildQuery(Cast(ref), Cast(sets));
  expect(ref.where).toHaveBeenCalledTimes(3);
  expect(ref.where).toHaveBeenCalledWith(...sets[0]);
  expect(ref.where).toHaveBeenCalledWith(...sets[1]);
  expect(ref.where).toHaveBeenCalledWith(...sets[2]);
});

test('serverCreateUpdateTimestamp', () => {
  const createTimestamp = serverCreateUpdateTimestamp({});
  expect(createTimestamp).toEqual({
    createdAt: { TIMESTAMP: true },
    updatedAt: { TIMESTAMP: true },
  });
});

test('serverCreateTimestamp', () => {
  const createTimestamp = serverCreateTimestamp({});
  expect(createTimestamp).toEqual({
    createdAt: { TIMESTAMP: true },
  });
});

test('serverUpdateTimestamp', () => {
  const updateTimestamp = serverUpdateTimestamp({});
  expect(updateTimestamp).toEqual({ updatedAt: { TIMESTAMP: true } });
});

test('safeFirestoreCreateUpdate', () => {
  const data = safeFirestoreCreateUpdate({ test: undefined, defined: true });
  expect(data).not.toHaveProperty('awesome');
  expect(data).toHaveProperty('defined');
  expect(data).toHaveProperty('createdAt');
  expect(data).toHaveProperty('updatedAt');
});

test('safeFirestoreCreate', () => {
  const data = safeFirestoreCreate({ test: undefined, defined: true });
  expect(data).not.toHaveProperty('awesome');
  expect(data).toHaveProperty('defined');
  expect(data).toHaveProperty('createdAt');
});

test('safeFirestoreUpdate', () => {
  const data = safeFirestoreUpdate({ test: undefined, defined: true });
  expect(data).not.toHaveProperty('awesome');
  expect(data).toHaveProperty('defined');
  expect(data).toHaveProperty('updatedAt');
});
