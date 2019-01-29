const { argv } = require('yargs');
const { configDir } = require('../utils');
const { homedir } = require('os');
const firebaseTools = require('firebase-tools');
const inquirer = require('inquirer');
const fs = require('mz/fs');
const { resolve } = require('path');

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

      const projects = await firebaseTools.list({ token });
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

    // Write config to top-level config directory
    await firebaseTools.setup
      .web({ project, token })
      .then(config => fs.writeFile(configDir('test', 'db.json'), JSON.stringify(config, null, 2)));

    // Deploy database rules
    await firebaseTools.deploy({
      project,
      token,
      cwd: configDir(),
    });
  })
  .then(() => {
    console.log('Success! Exiting...');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
