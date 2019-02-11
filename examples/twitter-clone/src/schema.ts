import { Schema, TypeOfCreateData } from '@schemafire/firestore';
import { Collection, relationshipCodec, tweetCodec, userCodec, usernameCodec } from './codecs';
import { relationshipId } from './utils';

export const User = new Schema({
  codec: userCodec,
  collection: Collection.User,
  config: { autoValidate: true },
  // Todo implement a rules parser
  rules: { username: { uniqueInCollection: Collection.Username } },
});

export const Username = new Schema({
  codec: usernameCodec,
  collection: Collection.Username,
  config: { autoValidate: false, emptyCollection: true },
});

export const Relationship = new Schema({
  codec: relationshipCodec,
  collection: Collection.Relationship,
  staticMethods: {
    createRelationship: schema => (data: TypeOfCreateData<typeof schema>) => {
      return schema.create({ data, id: relationshipId(data.follower, data.following) });
    },
  },
});

export const Tweet = new Schema({
  codec: tweetCodec,
  collection: Collection.Tweet,
});
