import '@kj/plejio-server-core/setup-server-environment';
import 'source-map-support/register';

import { APPLE_SITE_ASSOCIATION } from '@kj/plejio-core/constants';
import { json } from 'body-parser';
import colors from 'chalk';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import debug from 'debug';
import dotenv from 'dotenv';
import express from 'express';
import admin from 'firebase-admin';
import v4 from 'nanoid';
import next from 'next';

import routes from '@routes';
import { getDeviceId, getSession } from '@utils/helpers';
import { namespace } from '@utils/logger';

import {
  getDateLocale,
  getLocaleDataScript,
  getMessages,
  supportedLocales,
} from '@kj/plejio-messages/lib/server';
import { login, logout } from '@server/api/auth';
import { getTokenFromUserSession, isInternalNextUrl, isUserLoggedIn } from '@server/helpers';
import { asyncMiddleware } from '@server/middleware';
import { IncomingMessage } from 'http';
import { join } from 'path';
import { parse } from 'url';

import acceptLanguageParser from 'accept-language-parser';
import { pathOr } from 'ramda';

const log = debug(namespace('server'));

dotenv.config();

/* Initial setup */

let port = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'test') {
  port = 3001;
}

const dev = process.env.NODE_ENV !== 'production';
export const server = express();

const app = next({ dev });
const handler = routes.getRequestHandler(app);

/* Decode the base64 key */

const decoded = Buffer.from(process.env.FIREBASE_JSON_SECRET, 'base64').toString('ascii');
const serviceAccountKey = JSON.parse(decoded);

/* Initialize Firebase Admin */

const firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

/* A temporary fix to ensure timestamps are correctly used */

const settings = { timestampsInSnapshots: true };
firebase.firestore().settings(settings);

/* Generate middleware */

const csrfProtection = csurf({ cookie: true });

server.use(cookieParser('my-secret')); // TODO enable signed cookies with a secret https://github.com/expressjs/cookie-parser
server.use(json());
server.use('/', express.static(dev ? join(__dirname, 'dist', 'workers') : join(__dirname, 'workers')));

log('Next app ready: Adding routes');

/* iOS Deep Links */

server.get('/apple-app-site-association', (_, res) => {
  res.json(APPLE_SITE_ASSOCIATION);
});

server.get('/firebase-messaging-sw.js', (req, res) => {
  const filePath = join(__dirname, 'workers', '/firebase-messaging-sw.js');
  return app.serveStatic(req, res, filePath);
});

server.get('/sw.js', (req, res) => {
  const filePath = join(__dirname, 'workers', '/sw.js');
  return app.serveStatic(req, res, filePath);
});

/* API Calls */

server.post('/api/login', csrfProtection, asyncMiddleware(login));
server.post('/api/logout', csrfProtection, asyncMiddleware(logout));

/* Retrieve the preferred language for the user */
const getAcceptsLanguage: (req: IncomingMessage) => string = pathOr('en-gb,en;q=0.8', [
  'headers',
  'accept-language',
]);

/* NextJS Handler */

server.get('*', csrfProtection, async (req, res) => {
  if (isInternalNextUrl(req.url)) {
    handler(req, res);
    return;
  }

  const parsedUrl = parse(req.url);
  const { pathname } = parsedUrl;

  if (pathname === '/service-worker.js') {
    const filePath = dev ? join(__dirname, 'dist', 'next', pathname) : join(__dirname, 'next', pathname);
    await app.serveStatic(req, res, filePath);
    return;
  }

  const rootStaticFiles = ['/manifest.json', '/logo.png', '/favicon.ico'];

  if (pathname && rootStaticFiles.indexOf(pathname) > -1) {
    const filePath = join(__dirname, 'static', pathname);
    await app.serveStatic(req, res, filePath);
    return;
  }

  const deviceId = getDeviceId(req) || v4();
  req.deviceId = deviceId;

  /* Obtain the decoded token  and user ID */
  const userSession = await getTokenFromUserSession(getSession(req));

  if (isUserLoggedIn(userSession)) {
    /* Store the UID in the request so it can be used to populate the
    initial state the state and pass it into the request object */
    req.uid = userSession.token.uid;
  }

  /* i18n locale setup */
  req.locale = acceptLanguageParser.pick(supportedLocales, getAcceptsLanguage(req))!;
  // req.locale = 'de';
  req.localeDataScript = getLocaleDataScript(req.locale);
  req.messages = getMessages(req.locale);
  req.dateLocale = getDateLocale(req.locale);

  handler(req, res);
});

/* Launch application */

export default app
  .prepare()
  .then(() => {
    return server.listen(port, (err: Error) => {
      if (err) {
        throw err;
      }
      log(`Server started on port: ${colors.green.bold(port.toString())}`);
    });
  })

  /* Start listening to the express application */

  .catch(error => log('something went wrong', error));
