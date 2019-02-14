import { strings, utils } from '@schemafire/core';
import { documentReference } from '@schemafire/firestore';
import * as t from 'io-ts';

export enum Collection {
  User = 'users',
  Relationship = 'relationships',
  Username = 'usernames',
  Tweet = 'tweets',
}

export const userCodec = t.type({
  /** A username set at first sign up */
  username: strings.username({ minimum: 5, maximum: 20 }),
  email: strings.email,
});

export const relationshipCodec = t.type({
  /** The actor instigating the action */
  follower: documentReference,
  /** The recipient of this action */
  following: documentReference,
  /**
   * Action can be follow or block
   * @default block
   */
  type: t.keyof({
    block: null,
    follow: null,
  }),
});

/**
 * This has no values just the id (username) is important
 * Todo add configuration option for emptyCollection
 */
export const usernameCodec = t.type({});

export const tweetCodec = t.type({
  message: strings.max(280),
  messageObject: t.UnknownRecord,
  parent: utils.nullable(documentReference),
});
