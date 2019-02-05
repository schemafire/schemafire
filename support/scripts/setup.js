const { argv } = require('yargs');
const { supportDir, userFirebaseConfig } = require('../utils');
const firebaseTools = require('firebase-tools');
const inquirer = require('inquirer');
const fs = require('mz/fs');
const Listr = require('listr');
const chalk = require('chalk');

// Command Line Arguments
const userToken = argv.token;
const projectId = argv.projectId;

let cachedToken;

try {
  const config = require(userFirebaseConfig);
  cachedToken = config.tokens.refresh_token;
} catch (err) {
  console.log(
    chalk`{bold.red Something went wrong when trying to retrieve your authentication details}`,
  );
}

Promise.resolve(userToken || cachedToken)
  // Log in to firebase-tools
  .then(async userToken => {
    if (userToken) return userToken;
    const {
      tokens: { refresh_token: freshToken },
    } = await firebaseTools.login.ci();
    return freshToken;
  })
  // Capture the firebase test project
  .then(async token => {
    const project = await (async () => {
      if (projectId) return projectId;

      const projects = await firebaseTools.list({
        token,
      });
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectId',
          message: 'Which project would you like to use to test?',
          choices: projects.map(project => ({
            name: `${project.name} (${project.id})`,
            value: project,
          })),
        },
      ]);

      const {
        projectId: { id },
      } = response;

      return id;
    })();

    // Write config to top-level config directory and deploy rules
    const tasks = new Listr([
      {
        title: `Creating a local \`db.json\` file for the project ${project}`,
        task: () =>
          firebaseTools.setup
            .web({ project, token })
            .then(config =>
              fs.writeFile(supportDir('secrets', 'db.json'), JSON.stringify(config, null, 2)),
            ),
      },
      {
        title: `Deploying RealTime DB and Firestore rules`,
        task: () =>
          firebaseTools.deploy({
            project,
            token,
            cwd: supportDir('firebase'),
          }),
      },
    ]);

    await tasks.run();
  })
  .then(() => {
    process.exit();
  })
  .catch(err => {
    console.error('Something went wrong', err);
    process.exit(1);
  });
