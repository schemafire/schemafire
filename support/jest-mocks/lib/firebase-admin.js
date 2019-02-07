"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.firestore = exports.runTransaction = exports.collection = exports.collectionRef = exports.where = exports.collectionGet = exports.limit = exports.doc = exports.docData = exports.get = exports.snap = exports.snapData = void 0;
const snapData = {
  data: jest.fn(),
  exists: false,
  id: '',
  ref: jest.fn(function () {
    return {};
  }),
  createTime: undefined,
  updateTime: undefined,
  readTime: undefined,
  get: jest.fn()
};
exports.snapData = snapData;
const snap = jest.fn(function () {
  return snapData;
});
exports.snap = snap;
const get = jest.fn(function () {
  return {
    snap
  };
});
exports.get = get;
const docData = {
  get,
  id: 'mock_doc_id_acvg5tryuiadsfFG'
};
exports.docData = docData;
const doc = jest.fn(function () {
  return docData;
});
exports.doc = doc;
const limit = jest.fn();
exports.limit = limit;
const collectionGet = jest.fn();
exports.collectionGet = collectionGet;
const where = jest.fn(function () {
  return {
    doc,
    where,
    limit
  };
});
exports.where = where;
const collectionRef = {
  doc,
  where,
  limit,
  get: collectionGet
};
exports.collectionRef = collectionRef;
const collection = jest.fn(function () {
  return collectionRef;
});
exports.collection = collection;
const runTransaction = jest.fn().mockResolvedValue(undefined);
exports.runTransaction = runTransaction;
const firestore = jest.fn(function () {
  return {
    collection,
    settings: jest.fn(),
    runTransaction,
    doc
  };
});
exports.firestore = firestore;
firestore.FieldValue = {
  serverTimestamp: jest.fn().mockReturnValue({
    TIMESTAMP: true
  }),
  delete: jest.fn().mockReturnValue({
    VALUE: true
  })
};
firestore.Timestamp = jest.fn(function () {
  return {
    toDate: jest.fn(function () {
      return new Date();
    }),
    toMillis: jest.fn(function () {
      return Date.now();
    })
  };
});

class Timestamp {}

const timestamp = new Timestamp();
firestore.Timestamp.now = jest.fn(function () {
  return timestamp;
});
firestore.Timestamp.fromDate = jest.fn(function () {
  return timestamp;
});
firestore.Timestamp.fromMillis = firestore.Timestamp.fromDate;
const initializeApp = jest.fn(function () {
  return {
    auth() {
      return {
        async verifySessionCookie(cookie) {
          if (cookie === 'verified') {
            return {
              uid: 'abc123'
            };
          } else {
            return Promise.reject('No session found');
          }
        }

      };
    },

    credential: {
      cert: jest.fn()
    },
    firestore
  };
});
const admin = {
  auth() {
    return {
      async verifySessionCookie(cookie) {
        if (cookie === 'verified') {
          return {
            uid: 'abc123'
          };
        } else {
          return Promise.reject('No session found');
        }
      }

    };
  },

  credential: {
    cert: jest.fn()
  },
  firestore,
  initializeApp
};
var _default = admin;
exports.default = _default;
//# sourceMappingURL=firebase-admin.js.map