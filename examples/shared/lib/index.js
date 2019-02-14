"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _codecs = require("./codecs");

Object.keys(_codecs).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _codecs[key];
    }
  });
});
//# sourceMappingURL=index.js.map