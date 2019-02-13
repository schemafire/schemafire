import { CookieOptions, Request, Response } from 'express';
import admin from 'firebase-admin';
import { get } from 'lodash/fp';
import { AUTH_SESSION, COOKIE_EXPIRES_IN } from '../utils/constants';
import { getSession } from '../utils/helpers';
import { createCustomError, respondWithError } from './errors';

/**
 * Login api used for signaling to the server that a user has logged in.
 * Helps with rendering authenticated data on the client and server without the flash of unauthenticated content.
 */
export const login = async (req: Request, res: Response) => {
  const token: string | undefined = get(['body', 'token'], req);
  if (!token) {
    const error = createCustomError({
      status: 'invalid-argument',
      message: 'No token provided',
    });
    respondWithError(error, res);
    return;
  }

  const currentCookie = getSession(req);
  if (currentCookie) {
    res.json({ status: true });
    return;
  }

  try {
    /* Create the auth cookie */
    const cookie = await admin.auth().createSessionCookie(token, { expiresIn: COOKIE_EXPIRES_IN });

    /* Set the auth cookie which is picked up by cookie-parser and signed */
    const options: CookieOptions = {
      maxAge: COOKIE_EXPIRES_IN,
      httpOnly: true,
      signed: true,
      // TODO switch over to secure cookies which can only be served over HTTPS once I know how to set the flag in dev
      // secure: true,
    };
    /* Create and store the sessionIdentifier in the database */
    // const sessionIdentifier = createSessionHash(currentCookie);

    res.cookie(AUTH_SESSION, cookie, options);
    res.json({ status: true });
  } catch (err) {
    console.log(err);
    const error = createCustomError({
      status: 'invalid-argument',
      message: 'The token provided was incorrect',
    });
    respondWithError(error, res);
  }
};

/**
 * Remove the cookie when logout is triggered by the client. Prevents the non-logged in user from seeing any flash of authenticated content.
 */
export const logout = (req: Request, res: Response) => {
  const cookie = getSession(req);
  if (!cookie) {
    /* When no cookie exist flag this to the web client */
    const error = createCustomError({
      status: 'unauthenticated',
      message: 'This user was not logged in',
    });
    respondWithError(error, res);
  } else {
    res.clearCookie(AUTH_SESSION);
    res.json({ status: true });
  }
};
