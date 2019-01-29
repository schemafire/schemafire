import { schema } from '../__fixtures__/shared.fixtures';
import { Query } from '../query';

describe('constructor', () => {
  it('can be created', () => {
    const query = new Query({ schema, clauses: [['age', '==', 20]] });
    expect(query).toBeTruthy();
  });
});
