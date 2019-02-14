"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Env = void 0;

var _debugAgent = require("@google-cloud/debug-agent");

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

var _path = require("path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Env {
  static get isDev() {
    return true;
  }

  static get isProd() {
    return !Env.isDev;
  }

  static get info() {
    return process.env.LOCAL_DEPLOY === 'true' ? require('../../../support/secrets/db.json') : _objectSpread({
      credential: _firebaseAdmin.default.credential.cert(Env.serviceAccountKey)
    }, require('../db.json'));
  }

  static initializeApp() {
    if (Env.initialized) {
      return;
    }

    _firebaseAdmin.default.initializeApp(Env.info);

    const settings = {
      timestampsInSnapshots: true
    };

    const firestore = _firebaseAdmin.default.firestore();

    firestore.settings(settings);
    Env.initialized = true;
  }

}

exports.Env = Env;
Env.initialized = false;
Env.serviceAccountKey = process.env.LOCAL_DEPLOY === 'true' ? require('../../../support/secrets/key.json') : require('../secret.json');
Env.debug = (0, _debugAgent.start)({
  allowExpressions: true,
  projectId: Env.info.projectId,
  keyFilename: (0, _path.resolve)(__dirname, '../secret.json'),
  appPathRelativeToRepository: '@cloud/firebase'
});
Env.initializeApp();
//# sourceMappingURL=environment.js.map