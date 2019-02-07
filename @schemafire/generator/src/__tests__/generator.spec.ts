import { Schema } from '@schemafire/firestore';
import * as t from 'io-ts';
import { generateModels } from '../generator';

const userCodec = t.interface({
  username: t.string,
});

const User = new Schema({
  codec: userCodec,
  collection: 'users',
  defaultData: { username: '' },
});

describe('one schema', () => {
  it('can create fake data from one schema', () => {
    expect(generateModels([[User, 1]])).toMatchInlineSnapshot(`undefined`);
  });
});
