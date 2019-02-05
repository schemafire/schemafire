import firebaseTools from 'firebase-tools';
import { GlobalConfig } from 'jest-cli';

const { isLiveTest, userFirebaseConfig } = require('../utils');

module.exports = async (_: GlobalConfig) => {
  if (!isLiveTest()) {
    return;
  }

  const token = process.env.CI
    ? process.env.FIREBASE_TOKEN!
    : require(userFirebaseConfig()).tokens.refresh_token;

  const { projectId: project } = require('../secrets/db.json');
  const params = {
    project,
    token,
    yes: 'true',
    recursive: 'true',
  };
  try {
    await firebaseTools.firestore.delete(global.__DB_PREFIX__, params);
  } catch (e) {
    console.log('Something went wrong', e);
    return;
  }

  console.log('successfully deleted collections', global.__DB_PREFIX__);
};
