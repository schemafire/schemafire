import { Cast } from '@skeema/core';
import { buildQuery } from '../utils';

test('buildQuery', () => {
  const sets = [['set1', '==', 'check1'], ['set2', '==', 'check2'], ['set3', '==', 'check3']];
  const ref = { where: jest.fn() };
  buildQuery(Cast(ref), Cast(sets));
  expect(ref.where).toHaveBeenCalledTimes(3);
  expect(ref.where).toHaveBeenCalledWith(...sets[0]);
  expect(ref.where).toHaveBeenCalledWith(...sets[1]);
  expect(ref.where).toHaveBeenCalledWith(...sets[2]);
});
