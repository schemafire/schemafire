import {
  Cast,
  pathExistsAndHasChanged,
  safeFirestoreCreate,
  safeFirestoreCreateUpdate,
  safeFirestoreUpdate,
  serverCreateTimestamp,
  serverCreateUpdateTimestamp,
  serverUpdateTimestamp,
} from '../helpers';

jest.mock('firebase-admin', () => ({
  firestore: { FieldValue: { serverTimestamp: jest.fn(() => 'timestamp') } },
}));

test('serverCreateUpdateTimestamp', () => {
  const createTimestamp = serverCreateUpdateTimestamp({});
  expect(createTimestamp).toEqual({
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  });
});

test('serverCreateTimestamp', () => {
  const createTimestamp = serverCreateTimestamp({});
  expect(createTimestamp).toEqual({
    createdAt: 'timestamp',
  });
});

test('serverUpdateTimestamp', () => {
  const updateTimestamp = serverUpdateTimestamp({});
  expect(updateTimestamp).toEqual({ updatedAt: 'timestamp' });
});

test('pathExistsAndHasChanged', () => {
  const snap = {
    before: {
      data: jest.fn(() => ({ name: 'John' })),
      exists: true,
    },
    after: {
      data: jest.fn(() => ({ name: 'John' })),
      exists: true,
    },
  };
  expect(pathExistsAndHasChanged(['name'], Cast(snap))).toBe(false);
  snap.after.data.mockReturnValue({ name: 'Wonderful ' });
  expect(pathExistsAndHasChanged(['name'], Cast(snap))).toBe(true);
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
