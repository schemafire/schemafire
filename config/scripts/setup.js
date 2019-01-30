const { argv } = require('yargs');
const { configDir } = require('../utils');
const { homedir } = require('os');
const firebaseTools = require('firebase-tools');
const inquirer = require('inquirer');
const fs = require('mz/fs');
const { resolve } = require('path');
const Listr = require('listr');

// Command Line Arguments
const userToken = argv.token;
const projectId = argv.projectId;

let cachedToken;

try {
  const config = require(resolve(homedir(), '.config/configstore/firebase-tools.json'));
  cachedToken = config.tokens.refresh_token;
} catch (err) {}

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
              fs.writeFile(configDir('test', 'db.json'), JSON.stringify(config, null, 2)),
            ),
      },
      {
        title: `Deploying RealtimeDB and Firestore rules`,
        task: () =>
          firebaseTools.deploy({
            project,
            token,
            cwd: configDir(),
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
