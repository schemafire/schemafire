import { initializeLiveFirebase } from '@live-test-helpers';
import { strings } from '@schemafire/core';
import * as t from 'io-ts';
import { Schema } from '../schema';

jest.unmock('firebase-admin');

initializeLiveFirebase();

const testCodec = t.type({
  username: strings.username(),
});

const collection = {
  user: 'users',
  username: 'usernames',
};

const userSchema = new Schema({
  codec: testCodec,
  collection: collection.user,
  rules: { username: { uniqueInCollection: collection.username } },
});

const usernameSchema = new Schema({
  codec: t.type({}),
  collection: collection.username,
});

describe('uniqueInCollection', () => {
  beforeEach(() => {
    Schema.setDefaultConfig({ maxAttempts: 1 });
  });

  afterEach(() => {
    Schema.setDefaultConfig();
  });

  it('should automatically add itself to the collection', async () => {
    const username = await usernameSchema.findById('avalidusername').run();
    expect(username.exists).toBeFalse();
    await userSchema.create({ data: { username: 'avalidusername' } }).run();
    await username.run();
    // expect(username.exists).toBeTrue();
  });

  it.todo('implement proper testing of rules');
});
