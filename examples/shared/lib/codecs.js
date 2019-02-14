"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tweetCodec = exports.usernameCodec = exports.relationshipCodec = exports.userCodec = exports.Collection = void 0;

var _core = require("@schemafire/core");

var _firestore = require("@schemafire/firestore");

var t = _interopRequireWildcard(require("io-ts"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

let Collection;
exports.Collection = Collection;

(function (Collection) {
  Collection["User"] = "users";
  Collection["Relationship"] = "relationships";
  Collection["Username"] = "usernames";
  Collection["Tweet"] = "tweets";
})(Collection || (exports.Collection = Collection = {}));

const userCodec = t.type({
  /** A username set at first sign up */
  username: _core.strings.username({
    minimum: 5,
    maximum: 20
  }),
  email: _core.strings.email
});
exports.userCodec = userCodec;
const relationshipCodec = t.type({
  /** The actor instigating the action */
  follower: _firestore.documentReference,

  /** The recipient of this action */
  following: _firestore.documentReference,

  /**
   * Action can be follow or block
   * @default block
   */
  type: t.keyof({
    block: null,
    follow: null
  })
});
/**
 * This has no values just the id (username) is important
 * Todo add configuration option for emptyCollection
 */

exports.relationshipCodec = relationshipCodec;
const usernameCodec = t.type({});
exports.usernameCodec = usernameCodec;
const tweetCodec = t.type({
  message: _core.strings.max(280),
  messageObject: t.UnknownRecord,
  parent: _core.utils.nullable(_firestore.documentReference)
});
exports.tweetCodec = tweetCodec;
//# sourceMappingURL=codecs.js.map