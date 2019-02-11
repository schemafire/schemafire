import './utils/environment';

import glob from 'glob';

const files = glob.sync('./**/*.function?(s).js', {
  cwd: __dirname,
  ignore: './node_modules/**',
});

files.forEach(file => {
  const functions = require(file);
  Object.entries(functions).forEach(([name, fn]) => {
    exports[name] = fn;
  });
});
