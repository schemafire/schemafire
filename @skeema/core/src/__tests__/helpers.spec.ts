import { removeUndefined } from '../helpers';

test('removeUndefined', () => {
  const expected = { one: 1, two: null, three: '', four: false, five: NaN };
  const data = { ...expected, another: undefined };
  expect(removeUndefined(data)).toEqual(expected);
});
