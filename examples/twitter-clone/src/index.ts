import './utils/environment';

import glob from 'glob';

const files = glob.sync('./**/*.function?(s).js', {
  cwd: __dirname,
  ignore: './node_modules/**',
});

files.forEach(file => {
  const functions = require(file);
  Object.entries(functions).forEach(entry => {
    /* TODO figure out why array destructuring was causing issues */
    exports[entry[0]] = entry[1];
  });
});
