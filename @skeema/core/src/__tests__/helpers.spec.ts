import { Cast, pathExistsAndHasChanged } from '../helpers';

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
