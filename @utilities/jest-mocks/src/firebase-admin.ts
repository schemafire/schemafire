import { Timestamp } from '@google-cloud/firestore';

export const snapData = {
  data: jest.fn(),
  exists: false,
  id: '',
  ref: jest.fn(() => ({})),
  createTime: undefined,
  updateTime: undefined,
  readTime: undefined,
  get: jest.fn(),
};

export const snap = jest.fn(() => snapData);

export const get = jest.fn(() => ({
  snap,
}));

export const docData = {
  get,
  id: 'mock_doc_id_acvg5tryuiadsfFG',
};

export const doc = jest.fn(() => docData);
export const limit = jest.fn();

export const where: any = jest.fn(() => ({ doc, where, limit }));
export const collectionRef = {
  doc,
  where,
  limit,
};

export const collection: any = jest.fn(() => collectionRef);

export const runTransaction = jest.fn().mockResolvedValue(undefined);

export const firestore: any = jest.fn(() => ({
  collection,
  settings: jest.fn(),
  runTransaction,
  doc,
}));

firestore.FieldValue = {
  serverTimestamp: jest.fn().mockReturnValue({ TIMESTAMP: true }),
  delete: jest.fn().mockReturnValue({ VALUE: true }),
};

firestore.Timestamp = jest.fn(() => {
  return {
    toDate: jest.fn(() => new Date()),
    toMillis: jest.fn(() => Date.now()),
  };
});

const timestamp = Timestamp.now();
const fromDate = new Timestamp(timestamp.seconds, timestamp.nanoseconds);

firestore.Timestamp.now = jest.fn(() => timestamp);
firestore.Timestamp.fromDate = jest.fn(() => fromDate);
firestore.Timestamp.fromMillis = firestore.Timestamp.fromDate;

const initializeApp = jest.fn(() => ({
  auth() {
    return {
      async verifySessionCookie(cookie: string) {
        if (cookie === 'verified') {
          return { uid: 'abc123' };
        } else {
          return Promise.reject('No session found');
        }
      },
    };
  },
  credential: {
    cert: jest.fn(),
  },
  firestore,
}));

const admin = {
  auth() {
    return {
      async verifySessionCookie(cookie: string) {
        if (cookie === 'verified') {
          return { uid: 'abc123' };
        } else {
          return Promise.reject('No session found');
        }
      },
    };
  },
  credential: {
    cert: jest.fn(),
  },
  firestore,
  initializeApp,
};

export default admin;
