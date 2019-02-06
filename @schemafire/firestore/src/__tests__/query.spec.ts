import { schema } from '../__fixtures__/shared.fixtures';
import { Query } from '../query';

describe('constructor', () => {
  let query = new Query({ schema, clauses: [['age', '==', 20]] });

  beforeEach(() => {
    query = new Query({ schema, clauses: [['age', '==', 20]] });
  });

  it('can be created', () => {
    expect(query).toBeTruthy();
  });

  it('has methods', () => {
    expect(query.attachAll()).toBeInstanceOf(Query);
    expect(query.deleteAll()).toBeInstanceOf(Query);
    expect(query.overwriteAll()).toBeInstanceOf(Query);
    expect(query.updateAll()).toBeInstanceOf(Query);
  });
});
