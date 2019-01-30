const execa = require('execa');

if (!process.env.CI) {
  console.log('Building mocks...');

  execa('lerna', ['run', 'build', '--scope', '@skeema/jest-mocks'], {
    stdio: 'inherit',
  }).then(val => {
    console.log(val.stdout);
    process.exit();
  });
}
