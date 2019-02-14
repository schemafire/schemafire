"use strict";

require("./utils/environment");

var _glob = _interopRequireDefault(require("glob"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const files = _glob.default.sync('./**/*.function?(s).js', {
  cwd: __dirname,
  ignore: './node_modules/**'
});

files.forEach(function (file) {
  const functions = require(file);

  Object.entries(functions).forEach(function ([name, fn]) {
    exports[name] = fn;
  });
});
//# sourceMappingURL=index.js.map