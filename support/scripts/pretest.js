const { supportDir } = require('../utils');
const execa = require('execa');
const chalk = require('chalk');
const fs = require('mz/fs');
const semver = require('semver');

const REQ_YARN_VERSION = '1.0.0';

/**
 * Potential Problem #1:
 * Developer has not yet specified a valid test project
 */
function checkTestConfigExists() {
  if (!fs.existsSync(supportDir('secrets', 'db.json'))) {
    throw chalk`
{red You have not yet specified a Firebase project to use for testing.}
To create a test project, please visit {underline https://console.firebase.google.com/}.
After doing so, or if you already have a test project, please run the following command
at the root of this package:
$ yarn test:setup
`;
  }
}

/**
 * This is required for live tests which hit the real database.
 */
function checkServerKeyExists() {
  if (!fs.existsSync(supportDir('secrets', 'key.json'))) {
    throw chalk`
{red The live test suite requires a Firebase service account JSON key file testing.}
Create a new project in the Firebase console ({underline https://console.firebase.google.com}) if you do not already have one.
Use a separate, dedicated project for integration tests since the test suite makes a large number of writes to Firestore and RealtimeDB.
Download the service account key file from the
{bold "Settings > Service Accounts" }
page of the project, and copy it to {green \`config/test/key.json\` }
`;
  }
}

/**
 * Potential Problem #3:
 * Developer is not using a valid version of `yarn`
 */
async function validateCompatibleYarnVersion() {
  const version = (await execa('yarn', ['-v'])).stdout;

  if (semver.lt(version, REQ_YARN_VERSION)) {
    throw chalk`
{red Your globally installed version of yarn is not compatible}
We use yarn workspaces to manage this project and your version of yarn is not
compatible. Please visit {underline https://yarnpkg.com/lang/en/docs/install/}
for upgrade/installation instructions
`;
  }
}

/**
 * Potential Problem #4:
 * Developers yarn setup was misconfigured
 */
async function validateYarnInstall() {
  try {
    await execa('yarn', ['check', '--integrity']);
  } catch (err) {
    throw chalk`
{red Your yarn workspace didn't pass the integrity check}
To fix the integrity of your test environment please run the following at the
root of this package:
$ yarn install
`;
  }
}

const runChecks = (exports.runChecks = () => {
  return Promise.resolve()
    .then(() => checkTestConfigExists())
    .then(() => checkServerKeyExists())
    .then(() => validateCompatibleYarnVersion())
    .then(() => validateYarnInstall());
});

console.log('within checks');

if (!module.parent) {
  runChecks().catch(err => {
    console.error('Something went wrong', err);
    return process.exit(1);
  });
}
