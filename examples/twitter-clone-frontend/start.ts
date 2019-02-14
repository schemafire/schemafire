import 'source-map-support/register';

import { json } from 'body-parser';
import colors from 'chalk';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import dotenv from 'dotenv';
import express from 'express';
import admin from 'firebase-admin';
import next from 'next';

import routes from '@routes';
import { getSession } from '@utils/helpers';

import { login, logout } from '@server/auth.api';
import { getTokenFromUserSession, isInternalNextUrl, isUserLoggedIn } from '@server/helpers';
import { asyncMiddleware } from '@server/middleware';
import { join } from 'path';
import { parse } from 'url';

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

const decoded = Buffer.from(process.env.FIREBASE_JSON_SECRET || '', 'base64').toString('ascii');
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

console.info('Next app ready: Adding routes');

/* iOS Deep Links */

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

  /* Obtain the decoded token  and user ID */
  const userSession = await getTokenFromUserSession(getSession(req));

  if (isUserLoggedIn(userSession)) {
    /* Store the UID in the request so it can be used to populate the
    initial state the state and pass it into the request object */
    req.uid = userSession.token.uid;
  }

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
      console.info(`Server started on port: ${colors.green.bold(port.toString())}`);
    });
  })

  /* Start listening to the express application */

  .catch(error => console.error('something went wrong', error));
