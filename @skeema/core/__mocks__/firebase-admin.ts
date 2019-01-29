/* tslint:disable:no-any */

const snap = jest.fn(() => ({
  data: jest.fn(),
  exists: false,
  ref: doc,
  id: '',
  createTime: undefined,
  updateTime: undefined,
  readTime: undefined,
  get: jest.fn(),
}));

const get = jest.fn(() => ({
  snap,
}));

const doc = jest.fn(() => ({
  get,
}));

const collection: any = jest.fn(() => ({
  doc,
}));

const runTransaction = jest.fn().mockResolvedValue(undefined);

const firestore: any = jest.fn(() => ({
  collection,
  settings: jest.fn(),
  runTransaction,
}));

firestore.FieldValue = {
  serverTimestamp: jest.fn().mockReturnValue({ TIMESTAMP: true }),
};

const initializeApp = jest.fn(() => ({
  ...admin,
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
