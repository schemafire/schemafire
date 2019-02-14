"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tweet = exports.Relationship = exports.Username = exports.User = void 0;

var _firestore = require("@schemafire/firestore");

var _codecs = require("./codecs");

var _utils = require("./utils");

const User = new _firestore.Schema({
  codec: _codecs.userCodec,
  collection: _codecs.Collection.User,
  config: {
    autoValidate: true
  },
  // Todo implement a rules parser
  rules: {
    username: {
      uniqueInCollection: _codecs.Collection.Username
    }
  }
});
exports.User = User;
const Username = new _firestore.Schema({
  codec: _codecs.usernameCodec,
  collection: _codecs.Collection.Username,
  config: {
    autoValidate: false,
    emptyCollection: true
  }
});
exports.Username = Username;
const Relationship = new _firestore.Schema({
  codec: _codecs.relationshipCodec,
  collection: _codecs.Collection.Relationship,
  staticMethods: {
    createRelationship: function (schema) {
      return function (data, options = {}) {
        return schema.create({
          data,
          id: (0, _utils.relationshipId)(data.follower, data.following)
        }).run(options);
      };
    }
  }
});
exports.Relationship = Relationship;
const Tweet = new _firestore.Schema({
  codec: _codecs.tweetCodec,
  collection: _codecs.Collection.Tweet
});
exports.Tweet = Tweet;
//# sourceMappingURL=schema.js.map