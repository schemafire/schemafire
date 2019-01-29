import firebaseTools from 'firebase-tools';
import { GlobalConfig } from 'jest-cli';

const { isLiveTest, userFirebaseConfig } = require('./utils');

module.exports = async (_: GlobalConfig) => {
  if (!isLiveTest()) {
    return;
  }

  const { refresh_token: token } = require(userFirebaseConfig());
  const { projectId: project } = require('./test/db.json');
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
  // TODO fix this line once needed
  // await firebaseTools.database.remove(global.__DB_PREFIX__, params);
  console.log('successfully deleted collections', global.__DB_PREFIX__);
};
