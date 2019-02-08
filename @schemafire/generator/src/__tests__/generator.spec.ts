import { initializeFirebaseWithoutConfig } from '@live-test-helpers';
import { Schema } from '@schemafire/firestore';
import faker from 'faker';
import * as t from 'io-ts';
import { generateModels } from '../generator';

const SEED = 123;

const userCodec = t.interface({
  username: t.string,
});

initializeFirebaseWithoutConfig();

const User = new Schema({
  codec: userCodec,
  collection: 'users',
  defaultData: { username: '' },
});

describe('one schema', () => {
  it('can create fake data from one schema', () => {
    faker.seed(SEED);
    const count = 10;
    const fakeData = generateModels([[User, count]]);
    expect(fakeData).toMatchObject({ [User.collection]: expect.anything() });
    expect(fakeData[User.collection]).toHaveLength(count);
  });
});
