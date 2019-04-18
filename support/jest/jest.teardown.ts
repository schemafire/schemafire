import firebaseTools from 'firebase-tools';
import { TestEmulator } from './test-emulator';

const { isLiveTest, userFirebaseConfig } = require('../utils');

module.exports = async () => {
  if (!isLiveTest()) {
    return;
  }
  await TestEmulator.stop('firestore');

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
