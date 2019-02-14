"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.relationshipId = void 0;

/**
 * Create a relationship ID from the actor and recipient
 */
const relationshipId = function (actor, recipient) {
  return `${actor.id}_${recipient.id}`;
};

exports.relationshipId = relationshipId;
//# sourceMappingURL=utils.js.map